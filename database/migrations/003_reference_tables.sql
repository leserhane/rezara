-- Reference / lookup tables shared across modules.

create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  ice text,
  identifiant_fiscal text,
  rc text,
  payment_terms text,
  average_lead_time_days integer,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_key product_category_group not null default 'autres',
  parent_id uuid references product_categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create table payment_methods (
  id uuid primary key default gen_random_uuid(),
  code payment_method_code not null unique,
  name text not null,
  is_active boolean not null default true
);

create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true
);

alter table brands enable row level security;
alter table suppliers enable row level security;
alter table product_categories enable row level security;
alter table payment_methods enable row level security;
alter table expense_categories enable row level security;

create policy brands_read on brands for select using (auth.uid() is not null);
create policy brands_write on brands for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy suppliers_read on suppliers for select using (auth.uid() is not null);
create policy suppliers_write on suppliers for insert with check (auth.uid() is not null);
create policy suppliers_update on suppliers for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy suppliers_delete on suppliers for delete using (is_admin());

create policy categories_read on product_categories for select using (auth.uid() is not null);
create policy categories_write on product_categories for all using (is_admin()) with check (is_admin());

create policy payment_methods_read on payment_methods for select using (auth.uid() is not null);
create policy payment_methods_write on payment_methods for all using (is_admin()) with check (is_admin());

create policy expense_categories_read on expense_categories for select using (auth.uid() is not null);
create policy expense_categories_write on expense_categories for all using (is_admin()) with check (is_admin());
