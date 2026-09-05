-- Idempotent catch-up script covering migrations 023, 024, 026 (025 is
-- already confirmed applied on this project). Safe to run any number of
-- times and regardless of partial prior attempts — everything is guarded
-- with an existence check before creating it.

-- ===================================================================
-- 023: lens_order_sheets
-- ===================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'lens_sheet_category') then
    create type lens_sheet_category as enum ('homme_adulte', 'femme_adulte', 'homme_enfant', 'femme_enfant');
  end if;
  if not exists (select 1 from pg_type where typname = 'lens_sheet_type') then
    create type lens_sheet_type as enum ('standard', 'aminci', 'super_aminci', 'extra_aminci');
  end if;
  if not exists (select 1 from pg_type where typname = 'lens_sheet_material') then
    create type lens_sheet_material as enum ('organique', 'mineral', 'polycarbonate');
  end if;
  if not exists (select 1 from pg_type where typname = 'lens_sheet_finish') then
    create type lens_sheet_finish as enum ('clair', 'anti_reflet', 'lumiere_bleue', 'photochromique', 'transitions', 'teinte');
  end if;
  if not exists (select 1 from pg_type where typname = 'lens_sheet_vision') then
    create type lens_sheet_vision as enum ('loin', 'pres', 'intermediaire', 'progressif');
  end if;
end $$;

create table if not exists lens_order_sheets (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null unique references sales(id) on delete cascade,
  file_number text not null,
  order_date date not null default current_date,
  estimated_delivery_date date,

  category lens_sheet_category,
  lens_type lens_sheet_type,
  material lens_sheet_material,

  finish lens_sheet_finish,
  tint_category text,
  tint_color text,

  lens_index text,
  lens_index_other text,
  diameter text,
  diameter_other text,

  vision_type lens_sheet_vision,

  od_sphere numeric(5,2), od_cylinder numeric(5,2), od_axis integer, od_addition numeric(5,2),
  od_prism numeric(5,2), od_base text, od_pd numeric(5,2), od_height numeric(5,2),

  og_sphere numeric(5,2), og_cylinder numeric(5,2), og_axis integer, og_addition numeric(5,2),
  og_prism numeric(5,2), og_base text, og_pd numeric(5,2), og_height numeric(5,2),

  supplier_id uuid references suppliers(id) on delete set null,
  notes text,

  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lens_order_sheets_supplier on lens_order_sheets(supplier_id);

alter table lens_order_sheets enable row level security;

drop policy if exists lens_order_sheets_read on lens_order_sheets;
create policy lens_order_sheets_read on lens_order_sheets for select using (auth.uid() is not null);
drop policy if exists lens_order_sheets_insert on lens_order_sheets;
create policy lens_order_sheets_insert on lens_order_sheets for insert with check (auth.uid() is not null);
drop policy if exists lens_order_sheets_update on lens_order_sheets;
create policy lens_order_sheets_update on lens_order_sheets for update using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists lens_order_sheets_delete on lens_order_sheets;
create policy lens_order_sheets_delete on lens_order_sheets for delete using (is_admin());

drop trigger if exists trg_lens_order_sheets_updated_at on lens_order_sheets;
create trigger trg_lens_order_sheets_updated_at before update on lens_order_sheets
  for each row execute function set_updated_at();

-- ===================================================================
-- 024: notifications_last_seen_at
-- ===================================================================
alter table profiles add column if not exists notifications_last_seen_at timestamptz;

-- ===================================================================
-- 026: cheques
-- ===================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'cheque_status') then
    create type cheque_status as enum ('en_attente', 'encaisse', 'rejete');
  end if;
end $$;

create table if not exists cheques (
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

create index if not exists idx_cheques_sale on cheques(sale_id);
create index if not exists idx_cheques_due_date on cheques(due_date) where status = 'en_attente';

alter table cheques enable row level security;

drop policy if exists cheques_read on cheques;
create policy cheques_read on cheques for select using (auth.uid() is not null);
drop policy if exists cheques_no_direct_write on cheques;
create policy cheques_no_direct_write on cheques for insert with check (false);
drop policy if exists cheques_no_direct_update on cheques;
create policy cheques_no_direct_update on cheques for update using (false);

create or replace function record_cheque_payment(
  p_sale_id uuid,
  p_cheques jsonb,
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

-- ===================================================================
-- Confirm everything is now in place
-- ===================================================================
select 'lens_order_sheets table (023)' as migration, exists (
  select 1 from information_schema.tables where table_name = 'lens_order_sheets'
) as applied
union all
select 'notifications_last_seen_at column (024)', exists (
  select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'notifications_last_seen_at'
)
union all
select 'suppliers.categories column (025)', exists (
  select 1 from information_schema.columns where table_name = 'suppliers' and column_name = 'categories'
)
union all
select 'cheques table (026)', exists (
  select 1 from information_schema.tables where table_name = 'cheques'
);
