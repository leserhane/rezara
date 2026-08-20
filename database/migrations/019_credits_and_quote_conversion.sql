-- Credit management (échéances) and quote -> sale conversion.
--
-- record_payment() is extended with an optional p_credit_installment_id so
-- that a single call keeps sale.amount_paid, the credit balance, and the
-- specific installment's paid_amount/status all in sync atomically —
-- exactly the same "one function, one transaction" principle as the rest
-- of the financial RPCs.
--
-- The new parameter changes the function's type signature, so a plain
-- CREATE OR REPLACE would add a second overload instead of replacing the
-- 016 version (Postgres identifies functions by name + argument types,
-- not by name alone) — drop the old signature explicitly first.
drop function if exists record_payment(uuid, numeric, payment_type, uuid, uuid, text, text);

create or replace function record_payment(
  p_sale_id uuid,
  p_amount numeric,
  p_payment_type payment_type,
  p_payment_method_id uuid,
  p_cash_register_id uuid default null,
  p_reference text default null,
  p_notes text default null,
  p_credit_installment_id uuid default null
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
  v_installment credit_installments%rowtype;
  v_credit credits%rowtype;
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

  if p_credit_installment_id is not null then
    select * into v_installment from credit_installments where id = p_credit_installment_id for update;
    if not found then
      raise exception 'credit_installment_not_found';
    end if;
    if p_amount > (v_installment.amount - v_installment.paid_amount) then
      raise exception 'payment_exceeds_installment_due: due % requested %',
        v_installment.amount - v_installment.paid_amount, p_amount;
    end if;
  end if;

  insert into payments (
    payment_number, sale_id, customer_id, payment_type, amount, payment_method_id,
    cash_register_id, reference, notes, user_id, credit_installment_id
  ) values (
    next_document_number(v_sale.store_id, 'payment', true),
    p_sale_id, v_sale.customer_id, p_payment_type, p_amount, p_payment_method_id,
    p_cash_register_id, p_reference, p_notes, auth.uid(), p_credit_installment_id
  ) returning id into v_payment_id;

  v_new_status := case
    when v_sale.amount_paid + p_amount >= v_sale.total_ttc then 'paye'
    when v_sale.status = 'credit' then 'credit'
    when v_sale.amount_paid = 0 then 'acompte'
    else 'partiellement_paye'
  end;

  update sales set amount_paid = amount_paid + p_amount, status = v_new_status
  where id = p_sale_id
  returning * into v_sale;

  if p_credit_installment_id is not null then
    update credit_installments set
      paid_amount = paid_amount + p_amount,
      status = case when paid_amount + p_amount >= amount then 'payee' else status end,
      paid_at = case when paid_amount + p_amount >= amount then now() else paid_at end
    where id = p_credit_installment_id
    returning * into v_installment;

    update credits set
      paid_amount = paid_amount + p_amount,
      status = case when paid_amount + p_amount >= initial_amount then 'solde' else status end
    where id = v_installment.credit_id
    returning * into v_credit;
  end if;

  if p_cash_register_id is not null then
    insert into cash_movements (cash_register_id, type, amount, payment_method_id, reference_type, reference_id, user_id, notes)
    values (
      p_cash_register_id,
      (case p_payment_type when 'acompte' then 'acompte' when 'remboursement' then 'remboursement' else 'solde' end)::cash_movement_type,
      p_amount, p_payment_method_id, 'sale', p_sale_id, auth.uid(), p_notes
    );
  end if;

  update invoices set amount_paid = v_sale.amount_paid, amount_due = v_sale.amount_due
  where sale_id = p_sale_id;

  perform write_audit_log('payment.create', 'payments', 'sale', p_sale_id, to_jsonb(v_old_sale), to_jsonb(v_sale));

  return v_sale;
end;
$$;

--------------------------------------------------------------------------
-- create_credit: turn an unpaid/partially-paid sale's remaining balance
-- into a scheduled credit with installments (spec #19).
--------------------------------------------------------------------------
create or replace function create_credit(
  p_sale_id uuid,
  p_due_date date,
  p_frequency text,
  p_installments jsonb -- [{ "due_date": "2026-09-01", "amount": 1000 }, ...]
) returns credits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale sales%rowtype;
  v_credit credits%rowtype;
  v_installment jsonb;
  v_installments_total numeric := 0;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_sale from sales where id = p_sale_id for update;
  if not found then
    raise exception 'sale_not_found';
  end if;
  if v_sale.amount_due <= 0 then
    raise exception 'sale_has_no_outstanding_balance';
  end if;
  if exists (select 1 from credits where sale_id = p_sale_id and status <> 'solde') then
    raise exception 'sale_already_has_an_active_credit';
  end if;

  select coalesce(sum((it->>'amount')::numeric), 0) into v_installments_total
  from jsonb_array_elements(p_installments) it;

  if round(v_installments_total, 2) <> round(v_sale.amount_due, 2) then
    raise exception 'installments_must_sum_to_amount_due: due % installments_total %',
      v_sale.amount_due, v_installments_total;
  end if;

  insert into credits (sale_id, customer_id, initial_amount, due_date, frequency)
  values (p_sale_id, v_sale.customer_id, v_sale.amount_due, p_due_date, p_frequency)
  returning * into v_credit;

  for v_installment in select * from jsonb_array_elements(p_installments)
  loop
    insert into credit_installments (credit_id, due_date, amount)
    values (v_credit.id, (v_installment->>'due_date')::date, (v_installment->>'amount')::numeric);
  end loop;

  update sales set status = 'credit' where id = p_sale_id;

  perform write_audit_log('credit.create', 'credits', 'sale', p_sale_id, null, to_jsonb(v_credit));

  return v_credit;
end;
$$;

--------------------------------------------------------------------------
-- convert_quote_to_sale: build a sale from an accepted quote's lines,
-- through the exact same create_sale() path (so pricing is re-validated
-- against live product records, never trusted from the quote snapshot).
--------------------------------------------------------------------------
create or replace function convert_quote_to_sale(
  p_quote_id uuid,
  p_deposit_amount numeric default 0,
  p_payment_method_id uuid default null,
  p_cash_register_id uuid default null
) returns sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quote quotes%rowtype;
  v_items jsonb;
  v_sale sales%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_quote from quotes where id = p_quote_id for update;
  if not found then
    raise exception 'quote_not_found';
  end if;
  if v_quote.status = 'transforme' then
    raise exception 'quote_already_converted';
  end if;
  if v_quote.status in ('refuse', 'expire') then
    raise exception 'quote_cannot_be_converted_in_status_%', v_quote.status;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id', qi.product_id,
    'item_role', qi.item_role,
    'description', qi.description,
    'quantity', qi.quantity,
    'unit_price_ht_override', case when qi.product_id is null then qi.unit_price_ht else null end,
    'discount_amount', qi.discount_amount
  )), '[]'::jsonb) into v_items
  from quote_items qi where qi.quote_id = p_quote_id;

  if jsonb_array_length(v_items) = 0 then
    raise exception 'quote_has_no_items';
  end if;

  v_sale := create_sale(
    p_customer_id := v_quote.customer_id,
    p_items := v_items,
    p_prescription_id := v_quote.prescription_id,
    p_quote_id := p_quote_id,
    p_cart_discount_amount := v_quote.discount_amount,
    p_deposit_amount := p_deposit_amount,
    p_payment_method_id := p_payment_method_id,
    p_cash_register_id := p_cash_register_id,
    p_notes := v_quote.notes
  );

  update quotes set status = 'transforme', converted_sale_id = v_sale.id where id = p_quote_id;

  perform write_audit_log('quote.convert', 'quotes', 'quote', p_quote_id, null, jsonb_build_object('sale_id', v_sale.id));

  return v_sale;
end;
$$;

grant execute on function record_payment(uuid, numeric, payment_type, uuid, uuid, text, text, uuid) to authenticated;
grant execute on function create_credit(uuid, date, text, jsonb) to authenticated;
grant execute on function convert_quote_to_sale(uuid, numeric, uuid, uuid) to authenticated;

-- credits/credit_installments already have "no direct write" RLS from
-- 007_payments_credits_cash.sql; create_credit()/record_payment() are the
-- only paths that mutate them.
