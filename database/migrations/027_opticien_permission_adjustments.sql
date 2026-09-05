-- Two permission changes for the opticien role:
--
-- 1. Tighten what was actually a server-side gap: suppliers insert/update
--    already only showed its button to admins in the UI, but the RLS
--    policy itself allowed any authenticated user to write directly
--    (never trust the frontend). Same for stock "entrée" (restocking) —
--    apply_stock_movement already blocked 'ajustement'/'inventaire' for
--    non-admins but let anyone log an 'entree', i.e. add inventory.
--
-- 2. A new, explicitly-granted capability: an optician can rebalance how
--    much of an already-issued invoice's total is attributed to the
--    frame vs. the lenses (common for insurance/mutuelle paperwork),
--    without ever being able to change the invoice's total.

-- ---------------------------------------------------------------------
-- 1a. Suppliers: creation and edits become admin-only, matching products.
-- ---------------------------------------------------------------------
drop policy if exists suppliers_write on suppliers;
create policy suppliers_write on suppliers for insert with check (is_admin());
drop policy if exists suppliers_update on suppliers;
create policy suppliers_update on suppliers for update using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- 1b. Stock: adding new inventory ("entrée de stock") becomes admin-only,
--     alongside the existing 'ajustement'/'inventaire' restriction.
--     Non-admins can still log a sortie, a customer return, or a return
--     to supplier — routine counter operations, not purchasing.
-- ---------------------------------------------------------------------
create or replace function apply_stock_movement(
  p_product_id uuid,
  p_type stock_movement_type,
  p_quantity_change integer,
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

  if p_type in ('ajustement', 'inventaire', 'entree') and not is_admin() then
    raise exception 'insufficient_privilege: only admin can add stock or adjust it manually' using errcode = '42501';
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

  perform write_audit_log('stock.movement', 'products', 'product', p_product_id, null, to_jsonb(v_movement));

  return v_movement;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. reallocate_invoice_item_prices: redistribute an invoice's total
--    across a chosen subset of its line items (typically the monture and
--    verre lines), never changing what the customer's invoice adds up
--    to. The underlying sale/sale_items are the POS record of what was
--    actually rung up and are deliberately left untouched — only the
--    invoice document (what's handed to the client or an insurer) can
--    show a different, equal-total breakdown.
-- ---------------------------------------------------------------------
create or replace function reallocate_invoice_item_prices(p_invoice_id uuid, p_items jsonb)
returns invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice invoices%rowtype;
  v_item jsonb;
  v_line invoice_items%rowtype;
  v_old_total_touched numeric := 0;
  v_new_total_touched numeric := 0;
  v_new_price_ttc numeric;
  v_new_line_total_ht numeric;
  v_new_unit_price_ht numeric;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if jsonb_array_length(p_items) < 1 then
    raise exception 'no_items_to_update';
  end if;

  select * into v_invoice from invoices where id = p_invoice_id for update;
  if not found then
    raise exception 'invoice_not_found: %', p_invoice_id;
  end if;

  -- Pass 1: validate every line belongs to this invoice and total up what
  -- the touched lines add to today, before changing anything.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_line from invoice_items
    where id = (v_item->>'invoice_item_id')::uuid and invoice_id = p_invoice_id
    for update;
    if not found then
      raise exception 'invoice_item_not_found_on_this_invoice: %', v_item->>'invoice_item_id';
    end if;
    v_old_total_touched := v_old_total_touched + v_line.line_total_ttc;

    v_new_price_ttc := (v_item->>'new_price_ttc')::numeric;
    if v_new_price_ttc is null or v_new_price_ttc < 0 then
      raise exception 'new_price_ttc_must_be_zero_or_positive';
    end if;
    v_new_total_touched := v_new_total_touched + v_new_price_ttc;
  end loop;

  -- The whole point: redistribute, never inflate or shrink the facture.
  if abs(round(v_new_total_touched - v_old_total_touched, 2)) > 0.01 then
    raise exception 'reallocation_must_preserve_the_invoice_total: was % now %', v_old_total_touched, v_new_total_touched;
  end if;

  -- Pass 2: apply. unit_price_ht is kept consistent with line_total_ht so
  -- a per-unit price display never drifts from the line's actual total.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_line from invoice_items where id = (v_item->>'invoice_item_id')::uuid for update;
    v_new_price_ttc := (v_item->>'new_price_ttc')::numeric;
    v_new_line_total_ht := round(v_new_price_ttc / (1 + v_line.tax_rate / 100), 2);
    v_new_unit_price_ht := round((v_new_line_total_ht + v_line.discount_amount) / v_line.quantity, 2);

    update invoice_items set
      unit_price_ht = v_new_unit_price_ht,
      line_total_ht = v_new_line_total_ht,
      line_total_ttc = v_new_price_ttc
    where id = v_line.id;
  end loop;

  -- The invoice's own total_ht/tax_amount/total_ttc are inherited from the
  -- sale's aggregate at issuance time (post cart-discount ratio) — they
  -- are NOT simply the sum of invoice_items, since a cart-level discount
  -- is never distributed down into individual lines. That's exactly why
  -- nothing here recomputes them from a fresh sum: the invariant already
  -- enforced above (touched lines' combined TTC unchanged) is what
  -- guarantees the invoice's bottom line is untouched, by construction.

  perform write_audit_log(
    'invoice.reallocate_prices', 'invoices', 'invoice', p_invoice_id,
    jsonb_build_object('total_ttc', v_old_total_touched), jsonb_build_object('total_ttc', v_new_total_touched)
  );

  return v_invoice;
end;
$$;

grant execute on function reallocate_invoice_item_prices(uuid, jsonb) to authenticated;
