-- Payments, Credits & Cash Register
--
-- Design note: rather than a separate `deposits` table duplicating payment
-- bookkeeping, deposits are simply payments with payment_type = 'acompte'.
-- One ledger avoids the sale total/paid/due figures ever going out of sync
-- across two tables (financial reliability requirement, spec #57/#42).

create table cash_registers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  opened_by uuid not null references profiles(id) on delete restrict,
  opened_at timestamptz not null default now(),
  opening_amount numeric(10,2) not null default 0,
  closed_by uuid references profiles(id) on delete set null,
  closed_at timestamptz,
  expected_cash numeric(10,2),
  actual_cash numeric(10,2),
  cash_difference numeric(10,2) generated always as (actual_cash - expected_cash) stored,
  status cash_register_status not null default 'ouverte',
  notes text
);

create unique index idx_cash_registers_one_open_per_store
  on cash_registers(store_id) where status = 'ouverte';

create table cash_movements (
  id uuid primary key default gen_random_uuid(),
  cash_register_id uuid not null references cash_registers(id) on delete restrict,
  type cash_movement_type not null,
  amount numeric(10,2) not null,
  payment_method_id uuid references payment_methods(id),
  reference_type text,
  reference_id uuid,
  user_id uuid references profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_cash_movements_register on cash_movements(cash_register_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  payment_number text not null unique,
  sale_id uuid references sales(id) on delete restrict,
  credit_installment_id uuid, -- fk added after credit_installments exists
  customer_id uuid not null references customers(id) on delete restrict,
  payment_type payment_type not null,
  amount numeric(10,2) not null check (amount > 0),
  payment_method_id uuid not null references payment_methods(id),
  cash_register_id uuid references cash_registers(id) on delete set null,
  reference text,
  notes text,
  user_id uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index idx_payments_sale on payments(sale_id);
create index idx_payments_customer on payments(customer_id);
create index idx_payments_created_at on payments(created_at desc);

create table credits (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete restrict,
  customer_id uuid not null references customers(id) on delete restrict,
  initial_amount numeric(10,2) not null,
  paid_amount numeric(10,2) not null default 0,
  balance numeric(10,2) generated always as (round(initial_amount - paid_amount, 2)) stored,
  due_date date,
  frequency text, -- e.g. 'mensuel', 'unique'
  status credit_status not null default 'actif',
  created_at timestamptz not null default now()
);

create index idx_credits_customer on credits(customer_id);
create index idx_credits_status on credits(status);

create table credit_installments (
  id uuid primary key default gen_random_uuid(),
  credit_id uuid not null references credits(id) on delete cascade,
  due_date date not null,
  amount numeric(10,2) not null,
  paid_amount numeric(10,2) not null default 0,
  status text not null default 'en_attente', -- en_attente, payee, en_retard
  paid_at timestamptz
);

alter table payments add constraint fk_payments_credit_installment
  foreign key (credit_installment_id) references credit_installments(id) on delete set null;

create index idx_credit_installments_credit on credit_installments(credit_id);

alter table cash_registers enable row level security;
alter table cash_movements enable row level security;
alter table payments enable row level security;
alter table credits enable row level security;
alter table credit_installments enable row level security;

create policy cash_registers_read on cash_registers for select using (auth.uid() is not null);
create policy cash_registers_insert on cash_registers for insert with check (auth.uid() is not null);
-- Closing a cash register is done via close_cash_register() RPC; a closed
-- register may only be edited again by an admin (spec #20).
create policy cash_registers_update on cash_registers for update
  using (status = 'ouverte' or is_admin())
  with check (true);

create policy cash_movements_read on cash_movements for select using (auth.uid() is not null);
create policy cash_movements_no_direct_write on cash_movements for insert with check (false);

create policy payments_read on payments for select using (auth.uid() is not null);
-- Payments are only ever inserted via record_payment() RPC so that sale
-- totals, cash movements and audit logs update atomically with them.
create policy payments_no_direct_write on payments for insert with check (false);
create policy payments_no_direct_update on payments for update using (false);
create policy payments_no_direct_delete on payments for delete using (false);

create policy credits_read on credits for select using (auth.uid() is not null);
create policy credits_no_direct_write on credits for insert with check (false);
create policy credits_no_direct_update on credits for update using (false);

create policy credit_installments_read on credit_installments for select using (auth.uid() is not null);
create policy credit_installments_no_direct_write on credit_installments for insert with check (false);
create policy credit_installments_no_direct_update on credit_installments for update using (false);
