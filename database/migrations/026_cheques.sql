-- Post-dated cheques as a flexible payment plan: a single sale can be
-- settled with several cheques (up to 5), each with its own due date, bank
-- and cheque number. The sale's amount_paid is credited for the full total
-- as soon as the cheques are handed over (they're a real payment
-- instrument, same as recording any other payment) via the existing
-- record_payment() — this table only tracks the breakdown for due-date
-- follow-up and lets a bounced cheque be reversed individually later.

create type cheque_status as enum ('en_attente', 'encaisse', 'rejete');

create table cheques (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  sale_id uuid not null references sales(id) on delete restrict,
  customer_id uuid not null references customers(id) on delete restrict,
  payment_id uuid references payments(id) on delete set null,
  cheque_number text,
  bank_name text,
  amount numeric(10,2) not null check (amount > 0),
  due_date date not null,
  status cheque_status not null default 'en_attente',
  cashed_at timestamptz,
  reject_reason text,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_cheques_sale on cheques(sale_id);
create index idx_cheques_due_date on cheques(due_date) where status = 'en_attente';

alter table cheques enable row level security;

create policy cheques_read on cheques for select using (auth.uid() is not null);
-- Writes only ever go through the RPCs below, which enforce the count
-- limit and keep the sale's amount_paid consistent with what's recorded.
create policy cheques_no_direct_write on cheques for insert with check (false);
create policy cheques_no_direct_update on cheques for update using (false);

--------------------------------------------------------------------------
-- record_cheque_payment: settle (part of) a sale with 1-5 post-dated
-- cheques in one go. Reuses record_payment for the actual amount_paid /
-- cash-drawer / invoice-sync logic (a cheque is never treated as cash,
-- since close_cash_register only counts payment_method code 'especes'),
-- then records each cheque individually for due-date tracking.
--------------------------------------------------------------------------
create or replace function record_cheque_payment(
  p_sale_id uuid,
  p_cheques jsonb, -- [{ amount, due_date, cheque_number, bank_name }, ...]
  p_cash_register_id uuid default null,
  p_notes text default null
) returns sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_customer_id uuid;
  v_cheque_method_id uuid;
  v_cheque_count integer;
  v_total numeric := 0;
  v_item jsonb;
  v_amount numeric;
  v_due_date date;
  v_sale sales%rowtype;
  v_payment_id uuid;
  v_amount_due numeric;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  v_cheque_count := jsonb_array_length(p_cheques);
  if v_cheque_count is null or v_cheque_count < 1 or v_cheque_count > 5 then
    raise exception 'cheque_count_must_be_between_1_and_5';
  end if;

  select store_id, customer_id, amount_due into v_store_id, v_customer_id, v_amount_due
  from sales where id = p_sale_id;
  if not found then
    raise exception 'sale_not_found: %', p_sale_id;
  end if;

  select id into v_cheque_method_id from payment_methods where code = 'cheque';
  if v_cheque_method_id is null then
    raise exception 'cheque_payment_method_not_configured';
  end if;

  for v_item in select * from jsonb_array_elements(p_cheques)
  loop
    v_amount := (v_item->>'amount')::numeric;
    v_due_date := (v_item->>'due_date')::date;
    if v_amount is null or v_amount <= 0 then
      raise exception 'each_cheque_amount_must_be_positive';
    end if;
    if v_due_date is null then
      raise exception 'each_cheque_needs_a_due_date';
    end if;
    v_total := v_total + v_amount;
  end loop;

  if round(v_total, 2) > v_amount_due then
    raise exception 'cheque_total_exceeds_amount_due: due % requested %', v_amount_due, v_total;
  end if;

  -- record_payment does its own row locking, amount_paid/status update,
  -- cash-drawer movement (skipped here, cheque is not cash) and invoice
  -- sync; it returns the sale, so the payment row is fetched right after.
  select * into v_sale from record_payment(
    p_sale_id, v_total,
    (case when v_total >= v_amount_due then 'solde' else 'acompte' end)::payment_type,
    v_cheque_method_id, null, null, p_notes
  );

  select id into v_payment_id from payments
  where sale_id = p_sale_id and payment_method_id = v_cheque_method_id
  order by created_at desc limit 1;

  for v_item in select * from jsonb_array_elements(p_cheques)
  loop
    insert into cheques (
      store_id, sale_id, customer_id, payment_id, cheque_number, bank_name, amount, due_date, created_by
    ) values (
      v_store_id, p_sale_id, v_customer_id, v_payment_id,
      nullif(v_item->>'cheque_number', ''), nullif(v_item->>'bank_name', ''),
      (v_item->>'amount')::numeric, (v_item->>'due_date')::date, auth.uid()
    );
  end loop;

  perform write_audit_log('cheque.record', 'cheques', 'sale', p_sale_id, null, jsonb_build_object('count', v_cheque_count, 'total', v_total));

  return v_sale;
end;
$$;

--------------------------------------------------------------------------
-- cash_cheque: mark a cheque as actually cashed at the bank. Doesn't touch
-- the sale — it was already credited when the cheque was received.
--------------------------------------------------------------------------
create or replace function cash_cheque(p_cheque_id uuid)
returns cheques
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cheque cheques%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_cheque from cheques where id = p_cheque_id for update;
  if not found then
    raise exception 'cheque_not_found';
  end if;
  if v_cheque.status <> 'en_attente' then
    raise exception 'cheque_already_% ', v_cheque.status;
  end if;

  update cheques set status = 'encaisse', cashed_at = now() where id = p_cheque_id
  returning * into v_cheque;

  perform write_audit_log('cheque.cash', 'cheques', 'cheque', p_cheque_id, null, to_jsonb(v_cheque));
  return v_cheque;
end;
$$;

--------------------------------------------------------------------------
-- reject_cheque: a cheque bounced. Reverses the amount it contributed to
-- the sale's amount_paid (the money never actually arrived), recomputing
-- status exactly like record_payment does, and keeps the invoice snapshot
-- in sync.
--------------------------------------------------------------------------
create or replace function reject_cheque(p_cheque_id uuid, p_reason text default null)
returns cheques
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cheque cheques%rowtype;
  v_sale sales%rowtype;
  v_old_sale sales%rowtype;
  v_new_status sale_status;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_cheque from cheques where id = p_cheque_id for update;
  if not found then
    raise exception 'cheque_not_found';
  end if;
  if v_cheque.status <> 'en_attente' then
    raise exception 'cheque_already_%', v_cheque.status;
  end if;

  select * into v_sale from sales where id = v_cheque.sale_id for update;
  v_old_sale := v_sale;

  v_new_status := case
    when v_sale.amount_paid - v_cheque.amount <= 0 then 'non_paye'
    when v_sale.amount_paid - v_cheque.amount >= v_sale.total_ttc then 'paye'
    else 'partiellement_paye'
  end;

  update sales set amount_paid = greatest(amount_paid - v_cheque.amount, 0), status = v_new_status
  where id = v_cheque.sale_id
  returning * into v_sale;

  update invoices set amount_paid = v_sale.amount_paid, amount_due = v_sale.amount_due
  where sale_id = v_cheque.sale_id;

  update cheques set status = 'rejete', reject_reason = p_reason where id = p_cheque_id
  returning * into v_cheque;

  perform write_audit_log('cheque.reject', 'cheques', 'sale', v_cheque.sale_id, to_jsonb(v_old_sale), to_jsonb(v_sale));
  return v_cheque;
end;
$$;

grant execute on function record_cheque_payment(uuid, jsonb, uuid, text) to authenticated;
grant execute on function cash_cheque(uuid) to authenticated;
grant execute on function reject_cheque(uuid, text) to authenticated;
