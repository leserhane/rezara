-- Orders (commandes / atelier) & Deliveries (livraisons)

create table orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  order_number text not null unique,
  sale_id uuid not null references sales(id) on delete restrict,
  customer_id uuid not null references customers(id) on delete restrict,
  supplier_id uuid references suppliers(id) on delete set null,
  status order_status not null default 'creee',
  expected_date date,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_sale on orders(sale_id);
create index idx_orders_customer on orders(customer_id);
create index idx_orders_status on orders(status);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  sale_item_id uuid references sale_items(id) on delete set null,
  description text not null,
  quantity integer not null default 1,
  status order_status not null default 'creee'
);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  changed_by uuid references profiles(id) on delete set null,
  changed_at timestamptz not null default now(),
  notes text
);

create index idx_order_status_history_order on order_status_history(order_id);

create table deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  sale_id uuid not null references sales(id) on delete restrict,
  status delivery_status not null default 'en_preparation',
  delivered_at timestamptz,
  delivered_by uuid references profiles(id) on delete set null,
  received_by_name text,
  signature_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_deliveries_sale on deliveries(sale_id);
create index idx_deliveries_order on deliveries(order_id);

alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table deliveries enable row level security;

create policy orders_read on orders for select using (auth.uid() is not null);
create policy orders_write on orders for insert with check (auth.uid() is not null);
create policy orders_update on orders for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy orders_delete on orders for delete using (is_admin());

create policy order_items_read on order_items for select using (auth.uid() is not null);
create policy order_items_write on order_items for insert with check (auth.uid() is not null);
create policy order_items_update on order_items for update using (auth.uid() is not null) with check (auth.uid() is not null);

create policy order_status_history_read on order_status_history for select using (auth.uid() is not null);
create policy order_status_history_write on order_status_history for insert with check (auth.uid() is not null);

create policy deliveries_read on deliveries for select using (auth.uid() is not null);
create policy deliveries_write on deliveries for insert with check (auth.uid() is not null);
create policy deliveries_update on deliveries for update using (auth.uid() is not null) with check (auth.uid() is not null);
