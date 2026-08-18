-- Products (montures / verres / lentilles / accessoires) & Stock
--
-- Design note: rather than four near-duplicate tables (frames, lenses,
-- contact_lenses, accessories) each re-implementing price/stock/supplier
-- fields, we use one `products` table holding everything shared (pricing,
-- stock, supplier, barcode) plus one 1-1 "details" table per type holding
-- only the fields specific to that type. This keeps stock_movements,
-- sale_items, pricing and margin logic in ONE place (financial reliability
-- requirement) while still modeling the domain accurately.

create table products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  type product_type not null,
  sku text not null unique, -- internal reference
  supplier_sku text, -- fournisseur reference
  barcode text unique,
  name text not null,
  brand_id uuid references brands(id) on delete set null,
  category_id uuid references product_categories(id) on delete set null,
  supplier_id uuid references suppliers(id) on delete set null,
  photo_url text,
  purchase_price_ht numeric(10,2) not null default 0 check (purchase_price_ht >= 0),
  sale_price_ht numeric(10,2) not null default 0 check (sale_price_ht >= 0),
  tax_rate numeric(5,2) not null default 20.00,
  sale_price_ttc numeric(10,2) generated always as (round(sale_price_ht * (1 + tax_rate / 100), 2)) stored,
  margin_amount numeric(10,2) generated always as (round(sale_price_ht - purchase_price_ht, 2)) stored,
  margin_percent numeric(6,2) generated always as (
    case when sale_price_ht = 0 then 0
    else round((sale_price_ht - purchase_price_ht) / sale_price_ht * 100, 2) end
  ) stored,
  quantity integer not null default 0,
  stock_min integer not null default 0,
  stock_max integer,
  location text,
  is_active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_type on products(type);
create index idx_products_brand on products(brand_id);
create index idx_products_category on products(category_id);
create index idx_products_supplier on products(supplier_id);
create index idx_products_barcode on products(barcode);
create index idx_products_name_trgm on products using gin (name gin_trgm_ops);
create index idx_products_low_stock on products(store_id) where quantity <= stock_min;

create table frame_details (
  product_id uuid primary key references products(id) on delete cascade,
  collection text,
  color text,
  size text,
  shape text,
  gender gender_type,
  material text
);

create table lens_details (
  product_id uuid primary key references products(id) on delete cascade,
  verrier text, -- lens maker / fournisseur de verre
  lens_type text,
  material text,
  refractive_index numeric(4,2),
  sphere numeric(5,2),
  cylinder numeric(5,2),
  addition numeric(5,2),
  treatment text, -- anti-reflet, anti-rayure, filtre lumiere bleue, photochromique, polarise, solaire, autres
  tint text,
  diameter numeric(5,2)
);

create table contact_lens_details (
  product_id uuid primary key references products(id) on delete cascade,
  range_name text, -- gamme
  wear_type text, -- journaliere, mensuelle, trimestrielle, annuelle
  lens_kind text, -- torique, multifocale, cosmetique, standard
  diameter numeric(5,2),
  base_curve numeric(5,2),
  power numeric(5,2),
  cylinder numeric(5,2),
  axis integer,
  addition numeric(5,2),
  material text
);

-- Stock movement journal — the single source of truth for quantity changes.
-- Direct UPDATE of products.quantity from the frontend is never allowed;
-- all changes go through the apply_stock_movement() RPC (see 030_rpc).
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete restrict,
  type stock_movement_type not null,
  quantity_change integer not null, -- signed: positive = in, negative = out
  previous_quantity integer not null,
  new_quantity integer not null,
  reason text,
  reference_type text, -- e.g. 'sale', 'order', 'inventory'
  reference_id uuid,
  user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_stock_movements_product on stock_movements(product_id, created_at desc);
create index idx_stock_movements_reference on stock_movements(reference_type, reference_id);

create table inventories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  reference text not null unique,
  status text not null default 'en_cours', -- en_cours, valide, annule
  started_by uuid references profiles(id) on delete set null,
  started_at timestamptz not null default now(),
  validated_by uuid references profiles(id) on delete set null,
  validated_at timestamptz,
  notes text
);

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references inventories(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  theoretical_quantity integer not null,
  counted_quantity integer,
  difference integer generated always as (coalesce(counted_quantity, 0) - theoretical_quantity) stored,
  counted_by uuid references profiles(id) on delete set null,
  counted_at timestamptz
);

create unique index idx_inventory_items_unique on inventory_items(inventory_id, product_id);

alter table products enable row level security;
alter table frame_details enable row level security;
alter table lens_details enable row level security;
alter table contact_lens_details enable row level security;
alter table stock_movements enable row level security;
alter table inventories enable row level security;
alter table inventory_items enable row level security;

create policy products_read on products for select using (auth.uid() is not null);
create policy products_admin_write on products for insert with check (is_admin());
create policy products_admin_update on products for update using (is_admin()) with check (is_admin());
create policy products_admin_delete on products for delete using (is_admin());

create policy frame_details_read on frame_details for select using (auth.uid() is not null);
create policy frame_details_write on frame_details for all using (is_admin()) with check (is_admin());
create policy lens_details_read on lens_details for select using (auth.uid() is not null);
create policy lens_details_write on lens_details for all using (is_admin()) with check (is_admin());
create policy contact_lens_details_read on contact_lens_details for select using (auth.uid() is not null);
create policy contact_lens_details_write on contact_lens_details for all using (is_admin()) with check (is_admin());

-- stock_movements: inserts only ever come from the apply_stock_movement()
-- SECURITY DEFINER function, never directly from the client.
create policy stock_movements_read on stock_movements for select using (auth.uid() is not null);
create policy stock_movements_no_direct_write on stock_movements for insert with check (false);
create policy stock_movements_no_update on stock_movements for update using (false);
create policy stock_movements_no_delete on stock_movements for delete using (false);

create policy inventories_read on inventories for select using (auth.uid() is not null);
create policy inventories_write on inventories for insert with check (auth.uid() is not null);
create policy inventories_update on inventories for update using (is_admin()) with check (is_admin());

create policy inventory_items_read on inventory_items for select using (auth.uid() is not null);
create policy inventory_items_write on inventory_items for insert with check (auth.uid() is not null);
create policy inventory_items_update on inventory_items for update using (auth.uid() is not null) with check (auth.uid() is not null);

-- Public-safe view: hides purchase cost & margin from non-admin roles.
-- The frontend reads product listings through this view, never the base
-- table's cost columns directly, so an opticien session never receives
-- purchase price / margin in the response payload.
create view v_products with (security_invoker = true) as
select
  p.id, p.store_id, p.type, p.sku, p.supplier_sku, p.barcode, p.name,
  p.brand_id, p.category_id, p.supplier_id, p.photo_url,
  case when is_admin() then p.purchase_price_ht else null end as purchase_price_ht,
  p.sale_price_ht, p.tax_rate, p.sale_price_ttc,
  case when is_admin() then p.margin_amount else null end as margin_amount,
  case when is_admin() then p.margin_percent else null end as margin_percent,
  p.quantity, p.stock_min, p.stock_max, p.location, p.is_active,
  p.created_by, p.created_at, p.updated_at
from products p;
