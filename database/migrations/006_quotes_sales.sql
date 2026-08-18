-- Quotes (devis) & Sales (ventes)

create table quotes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  quote_number text not null unique,
  customer_id uuid not null references customers(id) on delete restrict,
  prescription_id uuid references prescriptions(id) on delete set null,
  optician_id uuid not null references profiles(id) on delete restrict,
  status document_status not null default 'brouillon',
  subtotal_ht numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  tax_amount numeric(10,2) not null default 0,
  total_ht numeric(10,2) not null default 0,
  total_ttc numeric(10,2) not null default 0,
  valid_until date,
  converted_sale_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  product_id uuid references products(id) on delete restrict,
  item_role text not null default 'produit', -- monture, verre_od, verre_og, lentille, accessoire, service, produit
  description text,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_ht numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  tax_rate numeric(5,2) not null default 20.00,
  line_total_ht numeric(10,2) generated always as (round(unit_price_ht * quantity - discount_amount, 2)) stored,
  line_total_ttc numeric(10,2) generated always as (round((unit_price_ht * quantity - discount_amount) * (1 + tax_rate / 100), 2)) stored
);

create index idx_quote_items_quote on quote_items(quote_id);

create table sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  sale_number text not null unique,
  customer_id uuid not null references customers(id) on delete restrict,
  prescription_id uuid references prescriptions(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  optician_id uuid not null references profiles(id) on delete restrict,
  subtotal_ht numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  discount_authorized_by uuid references profiles(id) on delete set null,
  tax_amount numeric(10,2) not null default 0,
  total_ht numeric(10,2) not null default 0,
  total_ttc numeric(10,2) not null default 0,
  cost_total numeric(10,2) not null default 0,
  margin_amount numeric(10,2) not null default 0,
  margin_percent numeric(6,2) not null default 0,
  amount_paid numeric(10,2) not null default 0,
  amount_due numeric(10,2) generated always as (round(total_ttc - amount_paid, 2)) stored,
  status sale_status not null default 'non_paye',
  notes text,
  cancelled_at timestamptz,
  cancelled_by uuid references profiles(id) on delete set null,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sales_customer on sales(customer_id);
create index idx_sales_optician on sales(optician_id);
create index idx_sales_status on sales(status);
create index idx_sales_created_at on sales(created_at desc);
create index idx_sales_store on sales(store_id);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid references products(id) on delete restrict,
  item_role text not null default 'produit',
  description text,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_ht numeric(10,2) not null default 0,
  unit_cost_ht numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  tax_rate numeric(5,2) not null default 20.00,
  line_total_ht numeric(10,2) generated always as (round(unit_price_ht * quantity - discount_amount, 2)) stored,
  line_total_ttc numeric(10,2) generated always as (round((unit_price_ht * quantity - discount_amount) * (1 + tax_rate / 100), 2)) stored,
  line_cost_total numeric(10,2) generated always as (round(unit_cost_ht * quantity, 2)) stored,
  line_margin numeric(10,2) generated always as (round((unit_price_ht * quantity - discount_amount) - (unit_cost_ht * quantity), 2)) stored
);

create index idx_sale_items_sale on sale_items(sale_id);
create index idx_sale_items_product on sale_items(product_id);

alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;

create policy quotes_read on quotes for select using (auth.uid() is not null);
create policy quotes_write on quotes for insert with check (auth.uid() is not null);
create policy quotes_update on quotes for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy quotes_delete on quotes for delete using (is_admin());

create policy quote_items_read on quote_items for select using (auth.uid() is not null);
create policy quote_items_write on quote_items for insert with check (auth.uid() is not null);
create policy quote_items_update on quote_items for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy quote_items_delete on quote_items for delete using (auth.uid() is not null);

-- Sales are only ever created/mutated through the create_sale() /
-- record_payment() / cancel_sale() SECURITY DEFINER functions so that
-- totals, stock and cash movements always stay consistent.
create policy sales_read on sales for select using (auth.uid() is not null);
create policy sales_no_direct_write on sales for insert with check (false);
create policy sales_no_direct_update on sales for update using (false);
create policy sales_no_direct_delete on sales for delete using (false);

create policy sale_items_read on sale_items for select using (auth.uid() is not null);
create policy sale_items_no_direct_write on sale_items for insert with check (false);
create policy sale_items_no_direct_update on sale_items for update using (false);
create policy sale_items_no_direct_delete on sale_items for delete using (false);

-- Public-safe view: hides per-line cost/margin from non-admin roles.
create view v_sales with (security_invoker = true) as
select
  s.id, s.store_id, s.sale_number, s.customer_id, s.prescription_id, s.quote_id,
  s.optician_id, s.subtotal_ht, s.discount_amount, s.discount_percent,
  s.discount_authorized_by, s.tax_amount, s.total_ht, s.total_ttc,
  case when is_admin() then s.cost_total else null end as cost_total,
  s.margin_amount, s.margin_percent,
  s.amount_paid, s.amount_due, s.status, s.notes,
  s.cancelled_at, s.cancelled_by, s.cancel_reason,
  s.created_at, s.updated_at
from sales s;

create view v_sale_items with (security_invoker = true) as
select
  si.id, si.sale_id, si.product_id, si.item_role, si.description, si.quantity,
  si.unit_price_ht,
  case when is_admin() then si.unit_cost_ht else null end as unit_cost_ht,
  si.discount_amount, si.tax_rate, si.line_total_ht, si.line_total_ttc,
  case when is_admin() then si.line_cost_total else null end as line_cost_total,
  si.line_margin
from sale_items si;
