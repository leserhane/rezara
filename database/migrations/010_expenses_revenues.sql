-- Expenses & (manual) Revenues
--
-- Sales/payments already form the primary revenue ledger (see the
-- v_revenue_journal view in 013_reporting_views.sql). `revenues` here is
-- only for manual/miscellaneous income not tied to a sale.

create table expenses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  expense_number text not null unique,
  category_id uuid not null references expense_categories(id) on delete restrict,
  supplier_id uuid references suppliers(id) on delete set null,
  expense_date date not null default current_date,
  amount_ht numeric(10,2) not null,
  tax_amount numeric(10,2) not null default 0,
  amount_ttc numeric(10,2) generated always as (amount_ht + tax_amount) stored,
  payment_method_id uuid references payment_methods(id),
  receipt_url text,
  user_id uuid not null references profiles(id) on delete restrict,
  comment text,
  created_at timestamptz not null default now()
);

create index idx_expenses_category on expenses(category_id);
create index idx_expenses_date on expenses(expense_date desc);

create table revenues (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  revenue_date date not null default current_date,
  source text not null,
  amount numeric(10,2) not null,
  notes text,
  user_id uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table expenses enable row level security;
alter table revenues enable row level security;

create policy expenses_read on expenses for select using (auth.uid() is not null);
create policy expenses_write on expenses for insert with check (auth.uid() is not null);
create policy expenses_update on expenses for update using (is_admin()) with check (is_admin());
create policy expenses_delete on expenses for delete using (is_admin());

create policy revenues_read on revenues for select using (auth.uid() is not null);
create policy revenues_write on revenues for insert with check (is_admin());
create policy revenues_update on revenues for update using (is_admin()) with check (is_admin());
