-- Transactional RPC functions.
--
-- These are the ONLY way sales, payments, stock and cash movements are
-- ever written (see the "no direct write" RLS policies on those tables).
-- Every function here is SECURITY DEFINER, re-validates its inputs, and
-- runs inside the implicit transaction of the calling statement — if any
-- step raises, the whole operation rolls back (spec #42).

--------------------------------------------------------------------------
-- Stock movements
--------------------------------------------------------------------------
create or replace function apply_stock_movement(
  p_product_id uuid,
  p_type stock_movement_type,
  p_quantity_change integer, -- signed: positive = in, negative = out
  p_reason text default null,
  p_reference_type text default null,
  p_reference_id uuid default null
) returns stock_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
  v_new_quantity integer;
  v_movement stock_movements%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_type in ('ajustement', 'inventaire') and not is_admin() then
    raise exception 'insufficient_privilege: only admin can adjust stock manually' using errcode = '42501';
  end if;

  select * into v_product from products where id = p_product_id for update;
  if not found then
    raise exception 'product_not_found: %', p_product_id;
  end if;

  v_new_quantity := v_product.quantity + p_quantity_change;
  if v_new_quantity < 0 then
    raise exception 'insufficient_stock: product % has % in stock, requested change %',
      v_product.name, v_product.quantity, p_quantity_change using errcode = '23514';
  end if;

  update products set quantity = v_new_quantity where id = p_product_id;

  insert into stock_movements (
    product_id, type, quantity_change, previous_quantity, new_quantity,
    reason, reference_type, reference_id, user_id
  ) values (
    p_product_id, p_type, p_quantity_change, v_product.quantity, v_new_quantity,
    p_reason, p_reference_type, p_reference_id, auth.uid()
  ) returning * into v_movement;

  return v_movement;
end;
$$;

--------------------------------------------------------------------------
-- Discount authorization (admin step-up when an opticien exceeds their
-- configured max discount). Verifies real admin credentials server-side.
--------------------------------------------------------------------------
create or replace function authorize_discount_override(p_admin_email text, p_admin_password text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_admin_user_id uuid;
  v_role_key user_role_key;
begin
  select u.id into v_admin_user_id
  from auth.users u
  where u.email = p_admin_email
    and u.encrypted_password = crypt(p_admin_password, u.encrypted_password);

  if v_admin_user_id is null then
    raise exception 'invalid_credentials' using errcode = '28P01';
  end if;

  select r.key into v_role_key from profiles p join roles r on r.id = p.role_id where p.id = v_admin_user_id;
  if v_role_key is distinct from 'admin' then
    raise exception 'not_an_admin' using errcode = '42501';
  end if;

  return v_admin_user_id;
end;
$$;

--------------------------------------------------------------------------
-- create_sale: the core transactional sale-creation function.
--
-- p_items shape (jsonb array), one element per line:
--   { "product_id": uuid|null, "item_role": text, "description": text|null,
--     "quantity": int, "unit_price_ht_override": numeric|null,
--     "discount_amount": numeric|null }
-- product_id present  -> price/cost/tax pulled from the product record
--                        (client-sent price is ignored) and stock is
--                        decremented.
-- product_id null     -> a custom/service line; unit_price_ht_override is
--                        required, cost is 0, no stock movement.
--------------------------------------------------------------------------
create or replace function create_sale(
  p_customer_id uuid,
  p_items jsonb,
  p_prescription_id uuid default null,
  p_quote_id uuid default null,
  p_cart_discount_amount numeric default 0,
  p_deposit_amount numeric default 0,
  p_payment_method_id uuid default null,
  p_cash_register_id uuid default null,
  p_discount_authorized_by uuid default null,
  p_notes text default null
) returns sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_store_id uuid;
  v_sale sales%rowtype;
  v_item jsonb;
  v_product products%rowtype;
  v_quantity integer;
  v_unit_price_ht numeric;
  v_unit_cost_ht numeric;
  v_tax_rate numeric;
  v_line_discount numeric;
  v_description text;
  v_item_role text;
  v_subtotal_ht numeric := 0;
  v_items_tax numeric := 0;
  v_cost_total numeric := 0;
  v_discount_ratio numeric := 1;
  v_total_ht numeric;
  v_tax_amount numeric;
  v_total_ttc numeric;
  v_margin_amount numeric;
  v_margin_percent numeric;
  v_sale_item_id uuid;
  v_invoice invoices%rowtype;
  v_sale_number text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_profile from profiles where id = auth.uid();
  if not found or not v_profile.is_active then
    raise exception 'inactive_or_unknown_profile' using errcode = '28000';
  end if;
  v_store_id := v_profile.store_id;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'sale_must_have_at_least_one_item';
  end if;

  -- If a discount authorization was supplied, it must genuinely belong to
  -- an admin profile (its authenticity was already checked by
  -- authorize_discount_override(), this just guards against a stray id).
  if p_discount_authorized_by is not null then
    if not exists (select 1 from profiles p join roles r on r.id = p.role_id where p.id = p_discount_authorized_by and r.key = 'admin') then
      raise exception 'discount_authorized_by_must_be_admin' using errcode = '42501';
    end if;
  end if;

  v_sale_number := next_document_number(v_store_id, 'sale', true);

  insert into sales (
    store_id, sale_number, customer_id, prescription_id, quote_id, optician_id,
    discount_amount, discount_authorized_by
  ) values (
    v_store_id, v_sale_number, p_customer_id, p_prescription_id, p_quote_id, auth.uid(),
    p_cart_discount_amount, p_discount_authorized_by
  ) returning * into v_sale;

  -- Process each line item.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'invalid_item_quantity';
    end if;
    v_item_role := coalesce(v_item->>'item_role', 'produit');
    v_line_discount := coalesce((v_item->>'discount_amount')::numeric, 0);

    if (v_item->>'product_id') is not null then
      select * into v_product from products where id = (v_item->>'product_id')::uuid for update;
      if not found then
        raise exception 'product_not_found: %', v_item->>'product_id';
      end if;
      if not v_product.is_active then
        raise exception 'product_inactive: %', v_product.name;
      end if;
      if v_product.quantity < v_quantity then
        raise exception 'insufficient_stock_for_%: available % requested %', v_product.name, v_product.quantity, v_quantity;
      end if;
      v_unit_price_ht := v_product.sale_price_ht;
      v_unit_cost_ht := v_product.purchase_price_ht;
      v_tax_rate := v_product.tax_rate;
      v_description := coalesce(v_item->>'description', v_product.name);
    else
      v_unit_price_ht := (v_item->>'unit_price_ht_override')::numeric;
      if v_unit_price_ht is null then
        raise exception 'unit_price_ht_override_required_for_custom_line';
      end if;
      v_unit_cost_ht := 0;
      v_tax_rate := coalesce((v_item->>'tax_rate')::numeric, (select default_tax_rate from stores where id = v_store_id));
      v_description := coalesce(v_item->>'description', 'Article');
    end if;

    insert into sale_items (
      sale_id, product_id, item_role, description, quantity,
      unit_price_ht, unit_cost_ht, discount_amount, tax_rate
    ) values (
      v_sale.id,
      nullif(v_item->>'product_id', '')::uuid,
      v_item_role, v_description, v_quantity,
      v_unit_price_ht, v_unit_cost_ht, v_line_discount, v_tax_rate
    ) returning id into v_sale_item_id;

    if (v_item->>'product_id') is not null then
      perform apply_stock_movement(
        (v_item->>'product_id')::uuid, 'vente', -v_quantity,
        'Vente ' || v_sale_number, 'sale', v_sale.id
      );
    end if;

    v_subtotal_ht := v_subtotal_ht + round(v_unit_price_ht * v_quantity - v_line_discount, 2);
    v_items_tax := v_items_tax + round((v_unit_price_ht * v_quantity - v_line_discount) * v_tax_rate / 100, 2);
    v_cost_total := v_cost_total + round(v_unit_cost_ht * v_quantity, 2);
  end loop;

  -- Discount authorization threshold (server-side — never trust the
  -- frontend's own check). An opticien exceeding their configured max
  -- discount must supply an admin authorization obtained via
  -- authorize_discount_override().
  if v_subtotal_ht > 0 and not is_admin() then
    if (p_cart_discount_amount / v_subtotal_ht * 100) > v_profile.max_discount_percent
       and p_discount_authorized_by is null then
      raise exception 'discount_exceeds_% percent_authorization_required', v_profile.max_discount_percent
        using errcode = '42501';
    end if;
  end if;

  if v_subtotal_ht > 0 then
    v_discount_ratio := (v_subtotal_ht - p_cart_discount_amount) / v_subtotal_ht;
  end if;
  v_total_ht := round(v_subtotal_ht - p_cart_discount_amount, 2);
  v_tax_amount := round(v_items_tax * v_discount_ratio, 2);
  v_total_ttc := round(v_total_ht + v_tax_amount, 2);
  v_margin_amount := round(v_total_ht - v_cost_total, 2);
  v_margin_percent := case when v_total_ht = 0 then 0 else round(v_margin_amount / v_total_ht * 100, 2) end;

  update sales set
    subtotal_ht = v_subtotal_ht,
    tax_amount = v_tax_amount,
    total_ht = v_total_ht,
    total_ttc = v_total_ttc,
    cost_total = v_cost_total,
    margin_amount = v_margin_amount,
    margin_percent = v_margin_percent,
    discount_percent = case when v_subtotal_ht = 0 then 0 else round(p_cart_discount_amount / v_subtotal_ht * 100, 2) end,
    notes = p_notes
  where id = v_sale.id
  returning * into v_sale;

  -- Optional deposit at time of sale.
  if p_deposit_amount > 0 then
    perform record_payment(
      v_sale.id, p_deposit_amount, 'acompte', p_payment_method_id, p_cash_register_id,
      null, 'Acompte à la vente'
    );
    select * into v_sale from sales where id = v_sale.id;
  end if;

  -- Auto-generate the invoice snapshot.
  insert into invoices (
    store_id, invoice_number, sale_id, customer_id, total_ht, tax_amount,
    total_ttc, amount_paid, amount_due, issued_by
  ) values (
    v_store_id, next_document_number(v_store_id, 'invoice', true), v_sale.id, p_customer_id,
    v_sale.total_ht, v_sale.tax_amount, v_sale.total_ttc, v_sale.amount_paid, v_sale.amount_due, auth.uid()
  ) returning * into v_invoice;

  insert into invoice_items (invoice_id, description, quantity, unit_price_ht, discount_amount, tax_rate, line_total_ht, line_total_ttc)
  select v_invoice.id, si.description, si.quantity, si.unit_price_ht, si.discount_amount, si.tax_rate, si.line_total_ht, si.line_total_ttc
  from sale_items si where si.sale_id = v_sale.id;

  perform write_audit_log('sale.create', 'sales', 'sale', v_sale.id, null, to_jsonb(v_sale));

  insert into notifications (store_id, user_id, type, title, message, link)
  values (v_store_id, null, 'nouvelle_vente', 'Nouvelle vente', format('%s — %s MAD', v_sale.sale_number, v_sale.total_ttc), '/sales/' || v_sale.id);

  return v_sale;
end;
$$;

--------------------------------------------------------------------------
-- record_payment: settle a deposit / balance / full payment against a
-- sale. Updates sale.amount_paid & status, logs a cash movement and an
-- audit entry, all atomically.
--------------------------------------------------------------------------
create or replace function record_payment(
  p_sale_id uuid,
  p_amount numeric,
  p_payment_type payment_type,
  p_payment_method_id uuid,
  p_cash_register_id uuid default null,
  p_reference text default null,
  p_notes text default null
) returns sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale sales%rowtype;
  v_old_sale sales%rowtype;
  v_new_status sale_status;
  v_payment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_amount <= 0 then
    raise exception 'payment_amount_must_be_positive';
  end if;

  select * into v_sale from sales where id = p_sale_id for update;
  if not found then
    raise exception 'sale_not_found: %', p_sale_id;
  end if;
  if v_sale.status = 'annule' then
    raise exception 'cannot_pay_cancelled_sale';
  end if;
  v_old_sale := v_sale;

  if p_amount > v_sale.amount_due then
    raise exception 'payment_exceeds_amount_due: due % requested %', v_sale.amount_due, p_amount;
  end if;

  insert into payments (
    payment_number, sale_id, customer_id, payment_type, amount, payment_method_id,
    cash_register_id, reference, notes, user_id
  ) values (
    next_document_number(v_sale.store_id, 'payment', true),
    p_sale_id, v_sale.customer_id, p_payment_type, p_amount, p_payment_method_id,
    p_cash_register_id, p_reference, p_notes, auth.uid()
  ) returning id into v_payment_id;

  v_new_status := case
    when v_sale.amount_paid + p_amount >= v_sale.total_ttc then 'paye'
    when v_sale.amount_paid = 0 then 'acompte'
    else 'partiellement_paye'
  end;

  update sales set amount_paid = amount_paid + p_amount, status = v_new_status
  where id = p_sale_id
  returning * into v_sale;

  if p_cash_register_id is not null then
    insert into cash_movements (cash_register_id, type, amount, payment_method_id, reference_type, reference_id, user_id, notes)
    values (
      p_cash_register_id,
      (case p_payment_type when 'acompte' then 'acompte' when 'remboursement' then 'remboursement' else 'solde' end)::cash_movement_type,
      p_amount, p_payment_method_id, 'sale', p_sale_id, auth.uid(), p_notes
    );
  end if;

  -- Keep the invoice snapshot's paid/due amounts in sync.
  update invoices set amount_paid = v_sale.amount_paid, amount_due = v_sale.amount_due
  where sale_id = p_sale_id;

  perform write_audit_log('payment.create', 'payments', 'sale', p_sale_id, to_jsonb(v_old_sale), to_jsonb(v_sale));

  return v_sale;
end;
$$;

--------------------------------------------------------------------------
-- Cash register open / close
--------------------------------------------------------------------------
create or replace function open_cash_register(p_opening_amount numeric, p_notes text default null)
returns cash_registers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_register cash_registers%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into v_profile from profiles where id = auth.uid();

  if exists (select 1 from cash_registers where store_id = v_profile.store_id and status = 'ouverte') then
    raise exception 'a_cash_register_is_already_open_for_this_store';
  end if;

  insert into cash_registers (store_id, opened_by, opening_amount, notes)
  values (v_profile.store_id, auth.uid(), p_opening_amount, p_notes)
  returning * into v_register;

  insert into cash_movements (cash_register_id, type, amount, user_id, notes)
  values (v_register.id, 'fond_ouverture', p_opening_amount, auth.uid(), 'Fond de caisse');

  perform write_audit_log('cash_register.open', 'cash', 'cash_register', v_register.id, null, to_jsonb(v_register));

  return v_register;
end;
$$;

create or replace function close_cash_register(p_cash_register_id uuid, p_actual_cash numeric, p_notes text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_register cash_registers%rowtype;
  v_old_register cash_registers%rowtype;
  v_expected_cash numeric;
  v_totals_by_method jsonb;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_register from cash_registers where id = p_cash_register_id for update;
  if not found then
    raise exception 'cash_register_not_found';
  end if;
  if v_register.status = 'cloturee' and not is_admin() then
    raise exception 'insufficient_privilege: register already closed' using errcode = '42501';
  end if;
  v_old_register := v_register;

  -- The opening float (fond_ouverture) is always physical cash by
  -- definition, regardless of payment_method_id (which is left null for
  -- it); every other movement only counts toward the cash drawer when it
  -- was actually paid in cash (payment_method 'especes').
  select coalesce(sum(
    case
      when cm.type = 'fond_ouverture' then cm.amount
      when pm.code = 'especes' and cm.type in ('vente','acompte','solde','entree') then cm.amount
      when pm.code = 'especes' and cm.type in ('remboursement','depense','sortie') then -cm.amount
      else 0
    end
  ), 0) into v_expected_cash
  from cash_movements cm
  left join payment_methods pm on pm.id = cm.payment_method_id
  where cm.cash_register_id = p_cash_register_id;

  select jsonb_object_agg(coalesce(pm.code::text, 'especes'), total) into v_totals_by_method
  from (
    select cm.payment_method_id, sum(
      case when cm.type in ('vente','acompte','solde','entree','fond_ouverture') then cm.amount else -cm.amount end
    ) as total
    from cash_movements cm
    where cm.cash_register_id = p_cash_register_id
    group by cm.payment_method_id
  ) t
  left join payment_methods pm on pm.id = t.payment_method_id;

  update cash_registers set
    status = 'cloturee',
    closed_by = auth.uid(),
    closed_at = now(),
    expected_cash = v_expected_cash,
    actual_cash = p_actual_cash,
    notes = coalesce(p_notes, notes)
  where id = p_cash_register_id
  returning * into v_register;

  perform write_audit_log('cash_register.close', 'cash', 'cash_register', v_register.id, to_jsonb(v_old_register), to_jsonb(v_register));

  return jsonb_build_object(
    'register', to_jsonb(v_register),
    'totals_by_method', coalesce(v_totals_by_method, '{}'::jsonb)
  );
end;
$$;

--------------------------------------------------------------------------
-- cancel_sale: admin-only correction path (spec #4 — admin may
-- "annuler ou corriger certaines opérations"). Reverses stock and marks
-- the sale cancelled; does not delete history.
--------------------------------------------------------------------------
create or replace function cancel_sale(p_sale_id uuid, p_reason text)
returns sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale sales%rowtype;
  v_old_sale sales%rowtype;
  v_item sale_items%rowtype;
begin
  if not is_admin() then
    raise exception 'insufficient_privilege: only admin can cancel a sale' using errcode = '42501';
  end if;

  select * into v_sale from sales where id = p_sale_id for update;
  if not found then
    raise exception 'sale_not_found';
  end if;
  if v_sale.status = 'annule' then
    raise exception 'sale_already_cancelled';
  end if;
  if v_sale.amount_paid > 0 then
    raise exception 'cannot_cancel_sale_with_payments_use_refund_first';
  end if;
  v_old_sale := v_sale;

  for v_item in select * from sale_items where sale_id = p_sale_id and product_id is not null
  loop
    perform apply_stock_movement(v_item.product_id, 'retour_client', v_item.quantity, 'Annulation ' || v_sale.sale_number, 'sale', p_sale_id);
  end loop;

  update sales set status = 'annule', cancelled_at = now(), cancelled_by = auth.uid(), cancel_reason = p_reason
  where id = p_sale_id
  returning * into v_sale;

  perform write_audit_log('sale.cancel', 'sales', 'sale', p_sale_id, to_jsonb(v_old_sale), to_jsonb(v_sale));

  return v_sale;
end;
$$;
