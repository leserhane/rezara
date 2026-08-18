-- Invoices — immutable snapshot of a sale at the time of invoicing.

create table invoices (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  invoice_number text not null unique,
  sale_id uuid not null references sales(id) on delete restrict,
  customer_id uuid not null references customers(id) on delete restrict,
  issued_at timestamptz not null default now(),
  total_ht numeric(10,2) not null,
  tax_amount numeric(10,2) not null,
  total_ttc numeric(10,2) not null,
  amount_paid numeric(10,2) not null,
  amount_due numeric(10,2) not null,
  issued_by uuid not null references profiles(id) on delete restrict
);

create index idx_invoices_sale on invoices(sale_id);
create index idx_invoices_customer on invoices(customer_id);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity integer not null,
  unit_price_ht numeric(10,2) not null,
  discount_amount numeric(10,2) not null default 0,
  tax_rate numeric(5,2) not null,
  line_total_ht numeric(10,2) not null,
  line_total_ttc numeric(10,2) not null
);

create index idx_invoice_items_invoice on invoice_items(invoice_id);

alter table invoices enable row level security;
alter table invoice_items enable row level security;

create policy invoices_read on invoices for select using (auth.uid() is not null);
create policy invoices_no_direct_write on invoices for insert with check (false);
create policy invoices_no_direct_update on invoices for update using (false);
create policy invoices_no_direct_delete on invoices for delete using (false);

create policy invoice_items_read on invoice_items for select using (auth.uid() is not null);
create policy invoice_items_no_direct_write on invoice_items for insert with check (false);
