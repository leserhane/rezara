-- Optimum Optic ERP — full schema + base seed, consolidated for a single paste
-- into the Supabase SQL Editor. Generated from migrations/001-026 + seed/001.
-- Run this ONCE on a fresh Supabase project.


-- ===================================================================
-- 001_extensions_and_types.sql
-- ===================================================================
-- Optimum Optic ERP — Extensions & Enum Types
-- Run in order against a fresh Supabase/Postgres database.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm; -- fuzzy/global search

create type user_role_key as enum ('admin', 'opticien');

create type gender_type as enum ('homme', 'femme', 'autre');

create type product_type as enum ('monture', 'verre', 'lentille', 'accessoire');

create type product_category_group as enum (
  'optique_homme', 'optique_femme', 'optique_enfant',
  'solaire_homme', 'solaire_femme', 'solaire_enfant',
  'sport', 'premium', 'autres'
);

create type stock_movement_type as enum (
  'entree', 'sortie', 'transfert', 'ajustement',
  'retour_fournisseur', 'retour_client', 'vente', 'inventaire'
);

create type document_status as enum (
  'brouillon', 'envoye', 'accepte', 'refuse', 'expire', 'transforme'
);

create type sale_status as enum (
  'non_paye', 'acompte', 'partiellement_paye', 'paye', 'credit', 'annule'
);

create type payment_type as enum (
  'acompte', 'solde', 'paiement_total', 'echeance_credit', 'remboursement'
);

create type payment_method_code as enum (
  'especes', 'carte', 'virement', 'cheque', 'mobile', 'autre'
);

create type cash_movement_type as enum (
  'vente', 'acompte', 'solde', 'remboursement', 'depense', 'entree', 'sortie', 'fond_ouverture'
);

create type cash_register_status as enum ('ouverte', 'cloturee');

create type order_status as enum (
  'creee', 'verres_commandes', 'en_attente', 'recue', 'montage',
  'controle', 'prete', 'client_informe', 'livree', 'annulee'
);

create type delivery_status as enum ('en_preparation', 'prete', 'livree');

create type credit_status as enum ('actif', 'solde', 'en_retard');

create type appointment_status as enum ('planifie', 'confirme', 'realise', 'annule', 'absent');

create type notification_type as enum (
  'stock_faible', 'commande_prete', 'commande_en_retard', 'credit_echeance',
  'paiement_en_retard', 'inventaire', 'nouvelle_vente', 'remise_validation', 'autre'
);

-- ===================================================================
-- 002_roles_permissions_profiles.sql
-- ===================================================================
-- Roles / Permissions / Profiles
-- Evolutive permission system: business tables & RLS reference role KEY and
-- permission KEYS through role_permissions, so new roles can be added later
-- without changing table structure or RLS policies.

create table roles (
  id uuid primary key default gen_random_uuid(),
  key user_role_key not null unique,
  name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, -- e.g. 'sales.create', 'settings.accounting.edit'
  description text,
  created_at timestamptz not null default now()
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Optimum Optic',
  logo_url text,
  address text,
  phone text,
  email text,
  website text,
  ice text,
  identifiant_fiscal text,
  rc text,
  patente text,
  currency text not null default 'MAD',
  default_tax_rate numeric(5,2) not null default 20.00,
  created_at timestamptz not null default now()
);

-- Profiles extend Supabase auth.users with app-specific fields.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  store_id uuid not null references stores(id) on delete restrict,
  role_id uuid not null references roles(id) on delete restrict,
  first_name text not null,
  last_name text not null,
  phone text,
  is_active boolean not null default true,
  max_discount_percent numeric(5,2) not null default 10.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on profiles(role_id);
create index idx_profiles_store on profiles(store_id);

-- Helper functions used throughout RLS policies.
create or replace function auth_profile()
returns profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from profiles where id = auth.uid();
$$;

create or replace function auth_role_key()
returns user_role_key
language sql
stable
security definer
set search_path = public
as $$
  select r.key from profiles p join roles r on r.id = p.role_id where p.id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role_key() = 'admin', false);
$$;

create or replace function has_permission(perm_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles p
    join role_permissions rp on rp.role_id = p.role_id
    join permissions perm on perm.id = rp.permission_id
    where p.id = auth.uid() and perm.key = perm_key
  );
$$;

alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table stores enable row level security;
alter table profiles enable row level security;

create policy roles_read_all on roles for select using (auth.uid() is not null);
create policy permissions_read_all on permissions for select using (auth.uid() is not null);
create policy role_permissions_read_all on role_permissions for select using (auth.uid() is not null);
create policy stores_read_all on stores for select using (auth.uid() is not null);
create policy stores_admin_write on stores for all using (is_admin()) with check (is_admin());

create policy profiles_read_all on profiles for select using (auth.uid() is not null);
create policy profiles_self_update on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role_id = (auth_profile()).role_id);
create policy profiles_admin_write on profiles for all using (is_admin()) with check (is_admin());

-- ===================================================================
-- 003_reference_tables.sql
-- ===================================================================
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

-- ===================================================================
-- 004_customers_prescriptions.sql
-- ===================================================================
-- Customers (CRM) & Prescriptions

create table customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  customer_number text not null unique,
  first_name text not null,
  last_name text not null,
  phone text,
  whatsapp text,
  email text,
  address text,
  birth_date date,
  gender gender_type,
  notes text,
  tags text[] not null default '{}',
  assigned_optician_id uuid references profiles(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_customers_name on customers using gin ((first_name || ' ' || last_name) gin_trgm_ops);
create index idx_customers_phone on customers(phone);
create index idx_customers_email on customers(email);
create index idx_customers_store on customers(store_id);

create table customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  note text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table prescriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  -- OD (oeil droit)
  od_sphere numeric(5,2),
  od_cylinder numeric(5,2),
  od_axis integer,
  od_addition numeric(5,2),
  od_prism numeric(5,2),
  od_base text,
  od_acuity text,
  -- OG (oeil gauche)
  og_sphere numeric(5,2),
  og_cylinder numeric(5,2),
  og_axis integer,
  og_addition numeric(5,2),
  og_prism numeric(5,2),
  og_base text,
  og_acuity text,
  pd numeric(5,2),
  height numeric(5,2),
  correction_type text,
  vision_far_notes text,
  vision_intermediate_notes text,
  vision_near_notes text,
  prescription_date date not null default current_date,
  doctor_name text,
  valid_until date,
  file_url text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_prescriptions_customer on prescriptions(customer_id);

alter table customers enable row level security;
alter table customer_notes enable row level security;
alter table prescriptions enable row level security;

create policy customers_read on customers for select using (auth.uid() is not null);
create policy customers_write on customers for insert with check (auth.uid() is not null);
create policy customers_update on customers for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy customers_delete on customers for delete using (is_admin());

create policy customer_notes_read on customer_notes for select using (auth.uid() is not null);
create policy customer_notes_write on customer_notes for insert with check (auth.uid() is not null);
create policy customer_notes_delete on customer_notes for delete using (is_admin());

create policy prescriptions_read on prescriptions for select using (auth.uid() is not null);
create policy prescriptions_write on prescriptions for insert with check (auth.uid() is not null);
create policy prescriptions_update on prescriptions for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy prescriptions_delete on prescriptions for delete using (is_admin());

-- ===================================================================
-- 005_products_stock.sql
-- ===================================================================
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

-- ===================================================================
-- 006_quotes_sales.sql
-- ===================================================================
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

-- ===================================================================
-- 007_payments_credits_cash.sql
-- ===================================================================
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

-- ===================================================================
-- 008_invoices.sql
-- ===================================================================
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

-- ===================================================================
-- 009_orders_workshop_deliveries.sql
-- ===================================================================
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

-- ===================================================================
-- 010_expenses_revenues.sql
-- ===================================================================
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

-- ===================================================================
-- 011_promotions_appointments.sql
-- ===================================================================
-- Promotions & Appointments

create table promotions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  name text not null,
  discount_type text not null default 'percent', -- percent, amount
  discount_value numeric(10,2) not null,
  applies_to text not null default 'panier', -- panier, produit, categorie
  product_id uuid references products(id) on delete cascade,
  category_id uuid references product_categories(id) on delete cascade,
  starts_at date,
  ends_at date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  customer_id uuid not null references customers(id) on delete cascade,
  optician_id uuid references profiles(id) on delete set null,
  scheduled_at timestamptz not null,
  reason text,
  status appointment_status not null default 'planifie',
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_appointments_customer on appointments(customer_id);
create index idx_appointments_scheduled_at on appointments(scheduled_at);

alter table promotions enable row level security;
alter table appointments enable row level security;

create policy promotions_read on promotions for select using (auth.uid() is not null);
create policy promotions_write on promotions for all using (is_admin()) with check (is_admin());

create policy appointments_read on appointments for select using (auth.uid() is not null);
create policy appointments_write on appointments for insert with check (auth.uid() is not null);
create policy appointments_update on appointments for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy appointments_delete on appointments for delete using (auth.uid() is not null);

-- ===================================================================
-- 012_notifications_audit_backups_settings.sql
-- ===================================================================
-- Notifications, Audit Log, Backups, Settings

create table notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  user_id uuid references profiles(id) on delete cascade, -- null = broadcast to store
  type notification_type not null,
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id, is_read);
create index idx_notifications_store on notifications(store_id);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  action text not null, -- e.g. 'sale.create', 'product.price_update'
  module text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);
create index idx_audit_logs_user on audit_logs(user_id);
create index idx_audit_logs_created_at on audit_logs(created_at desc);

create table backups (
  id uuid primary key default gen_random_uuid(),
  taken_at timestamptz not null default now(),
  size_bytes bigint,
  status text not null default 'completed',
  location text,
  notes text
);

-- Store-wide configurable settings (numbering prefixes, discount rules,
-- VIP thresholds). One row per store.
create table store_settings (
  store_id uuid primary key references stores(id) on delete cascade,
  invoice_number_prefix text not null default 'FAC',
  sale_number_prefix text not null default 'VTE',
  quote_number_prefix text not null default 'DEV',
  order_number_prefix text not null default 'CMD',
  payment_number_prefix text not null default 'PAY',
  customer_number_prefix text not null default 'CL',
  expense_number_prefix text not null default 'DEP',
  opticien_max_discount_percent numeric(5,2) not null default 10.00,
  vip_bronze_threshold numeric(10,2) not null default 0,
  vip_silver_threshold numeric(10,2) not null default 5000,
  vip_gold_threshold numeric(10,2) not null default 15000,
  vip_platinum_threshold numeric(10,2) not null default 30000,
  inactive_customer_months integer not null default 18,
  updated_at timestamptz not null default now()
);

alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table backups enable row level security;
alter table store_settings enable row level security;

create policy notifications_read on notifications for select
  using (user_id = auth.uid() or (user_id is null and auth.uid() is not null));
create policy notifications_update_own on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_insert on notifications for insert with check (auth.uid() is not null);

create policy audit_logs_read on audit_logs for select using (is_admin());
create policy audit_logs_no_direct_write on audit_logs for insert with check (false);

create policy backups_read on backups for select using (is_admin());

create policy store_settings_read on store_settings for select using (auth.uid() is not null);
create policy store_settings_write on store_settings for all using (is_admin()) with check (is_admin());

-- ===================================================================
-- 013_numbering_and_audit.sql
-- ===================================================================
-- Document numbering (CL-000001, VTE-2026-000001, ...) & audit log helper

create table document_sequences (
  store_id uuid not null references stores(id) on delete cascade,
  doc_type text not null, -- 'customer', 'sale', 'quote', 'order', 'payment', 'invoice', 'expense'
  year integer not null default 0, -- 0 = not year-scoped (customers)
  last_value integer not null default 0,
  primary key (store_id, doc_type, year)
);

alter table document_sequences enable row level security;
create policy document_sequences_read on document_sequences for select using (auth.uid() is not null);

-- Returns the next formatted document number, e.g. 'VTE-2026-000001' or
-- 'CL-000001' for non-year-scoped types. Atomic via row locking.
create or replace function next_document_number(p_store_id uuid, p_doc_type text, p_year_scoped boolean default true)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer := case when p_year_scoped then extract(year from now())::integer else 0 end;
  v_next integer;
  v_prefix text;
  settings store_settings%rowtype;
begin
  select * into settings from store_settings where store_id = p_store_id;
  if not found then
    raise exception 'store_settings not found for store %', p_store_id;
  end if;

  v_prefix := case p_doc_type
    when 'customer' then settings.customer_number_prefix
    when 'sale' then settings.sale_number_prefix
    when 'quote' then settings.quote_number_prefix
    when 'order' then settings.order_number_prefix
    when 'payment' then settings.payment_number_prefix
    when 'invoice' then settings.invoice_number_prefix
    when 'expense' then settings.expense_number_prefix
    else upper(p_doc_type)
  end;

  insert into document_sequences (store_id, doc_type, year, last_value)
  values (p_store_id, p_doc_type, v_year, 1)
  on conflict (store_id, doc_type, year)
  do update set last_value = document_sequences.last_value + 1
  returning last_value into v_next;

  if p_year_scoped then
    return format('%s-%s-%s', v_prefix, v_year, lpad(v_next::text, 6, '0'));
  else
    return format('%s-%s', v_prefix, lpad(v_next::text, 6, '0'));
  end if;
end;
$$;

-- Generic audit log writer used by every RPC that mutates financial data.
create or replace function write_audit_log(
  p_action text, p_module text, p_entity_type text, p_entity_id uuid,
  p_old_value jsonb, p_new_value jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_logs (user_id, action, module, entity_type, entity_id, old_value, new_value)
  values (auth.uid(), p_action, p_module, p_entity_type, p_entity_id, p_old_value, p_new_value);
end;
$$;

-- ===================================================================
-- 014_triggers.sql
-- ===================================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_customers_updated_at before update on customers
  for each row execute function set_updated_at();
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger trg_quotes_updated_at before update on quotes
  for each row execute function set_updated_at();
create trigger trg_sales_updated_at before update on sales
  for each row execute function set_updated_at();
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger trg_store_settings_updated_at before update on store_settings
  for each row execute function set_updated_at();

-- Log every order status transition automatically.
create or replace function log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  elsif tg_op = 'INSERT' then
    insert into order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_order_status_history
  after insert or update on orders
  for each row execute function log_order_status_change();

-- Low stock notification: fires when a product crosses at/below its
-- minimum threshold.
create or replace function notify_low_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.quantity <= new.stock_min and (old.quantity is null or old.quantity > old.stock_min) then
    insert into notifications (store_id, user_id, type, title, message, link)
    values (
      new.store_id, null, 'stock_faible',
      'Stock faible',
      format('%s : stock actuel %s (seuil %s)', new.name, new.quantity, new.stock_min),
      '/products/' || new.id
    );
  end if;
  return new;
end;
$$;

create trigger trg_products_low_stock
  after update of quantity on products
  for each row execute function notify_low_stock();

-- Every new store automatically gets a default settings row so
-- next_document_number() always has something to read.
create or replace function create_default_store_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into store_settings (store_id) values (new.id);
  return new;
end;
$$;

create trigger trg_stores_default_settings
  after insert on stores
  for each row execute function create_default_store_settings();

--------------------------------------------------------------------------
-- Automatic document numbering: always server-assigned, any client-sent
-- value is ignored (spec #40 — numbers are automatic, not user-entered).
--------------------------------------------------------------------------
create or replace function assign_customer_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.customer_number := next_document_number(new.store_id, 'customer', false);
  return new;
end;
$$;
create trigger trg_customers_number before insert on customers
  for each row execute function assign_customer_number();

create or replace function assign_quote_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.quote_number := next_document_number(new.store_id, 'quote', true);
  return new;
end;
$$;
create trigger trg_quotes_number before insert on quotes
  for each row execute function assign_quote_number();

create or replace function assign_order_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.order_number := next_document_number(new.store_id, 'order', true);
  return new;
end;
$$;
create trigger trg_orders_number before insert on orders
  for each row execute function assign_order_number();

create or replace function assign_expense_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.expense_number := next_document_number(new.store_id, 'expense', true);
  return new;
end;
$$;
create trigger trg_expenses_number before insert on expenses
  for each row execute function assign_expense_number();

-- ===================================================================
-- 015_reporting_views.sql
-- ===================================================================
-- Reporting views: CRM stats, revenue journal, VIP tiers.

create view v_customer_stats with (security_invoker = true) as
select
  c.id as customer_id,
  c.store_id,
  count(s.id) filter (where s.status <> 'annule') as purchase_count,
  coalesce(sum(s.total_ttc) filter (where s.status <> 'annule'), 0) as lifetime_value,
  coalesce(avg(s.total_ttc) filter (where s.status <> 'annule'), 0) as average_basket,
  max(s.created_at) as last_purchase_at,
  coalesce(sum(s.amount_due) filter (where s.status not in ('annule', 'paye')), 0) as balance_due,
  case
    when coalesce(sum(s.total_ttc) filter (where s.status <> 'annule'), 0) >= (select vip_platinum_threshold from store_settings where store_id = c.store_id) then 'vip'
    when coalesce(sum(s.total_ttc) filter (where s.status <> 'annule'), 0) >= (select vip_gold_threshold from store_settings where store_id = c.store_id) then 'gold'
    when coalesce(sum(s.total_ttc) filter (where s.status <> 'annule'), 0) >= (select vip_silver_threshold from store_settings where store_id = c.store_id) then 'silver'
    else 'bronze'
  end as vip_tier
from customers c
left join sales s on s.customer_id = c.id
group by c.id, c.store_id;

create view v_revenue_journal with (security_invoker = true) as
select
  p.id, p.sale_id, 'vente'::text as source, p.payment_type, p.amount,
  p.payment_method_id, p.customer_id, p.user_id, p.created_at
from payments p
union all
select
  r.id, null::uuid as sale_id, 'autre'::text as source, null::payment_type as payment_type,
  r.amount, null::uuid as payment_method_id, null::uuid as customer_id, r.user_id, r.created_at
from revenues r;

create view v_low_stock_products with (security_invoker = true) as
select * from v_products where quantity <= stock_min and is_active = true;

-- ===================================================================
-- 016_rpc_functions.sql
-- ===================================================================
-- Transactional RPC functions.
--
-- These are the ONLY way sales, payments, stock and cash movements are
-- ever written (see the "no direct write" RLS policies on those tables).
-- Every function here is SECURITY DEFINER, re-validates its inputs, and
-- runs inside the implicit transaction of the calling statement — if any
-- step raises, the whole operation rolls back (spec #42).

--------------------------------------------------------------------------
-- Stock movements
--------------------------------------------------------------------------
create or replace function apply_stock_movement(
  p_product_id uuid,
  p_type stock_movement_type,
  p_quantity_change integer, -- signed: positive = in, negative = out
  p_reason text default null,
  p_reference_type text default null,
  p_reference_id uuid default null
) returns stock_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
  v_new_quantity integer;
  v_movement stock_movements%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_type in ('ajustement', 'inventaire') and not is_admin() then
    raise exception 'insufficient_privilege: only admin can adjust stock manually' using errcode = '42501';
  end if;

  select * into v_product from products where id = p_product_id for update;
  if not found then
    raise exception 'product_not_found: %', p_product_id;
  end if;

  v_new_quantity := v_product.quantity + p_quantity_change;
  if v_new_quantity < 0 then
    raise exception 'insufficient_stock: product % has % in stock, requested change %',
      v_product.name, v_product.quantity, p_quantity_change using errcode = '23514';
  end if;

  update products set quantity = v_new_quantity where id = p_product_id;

  insert into stock_movements (
    product_id, type, quantity_change, previous_quantity, new_quantity,
    reason, reference_type, reference_id, user_id
  ) values (
    p_product_id, p_type, p_quantity_change, v_product.quantity, v_new_quantity,
    p_reason, p_reference_type, p_reference_id, auth.uid()
  ) returning * into v_movement;

  return v_movement;
end;
$$;

--------------------------------------------------------------------------
-- Discount authorization (admin step-up when an opticien exceeds their
-- configured max discount). Verifies real admin credentials server-side.
--------------------------------------------------------------------------
create or replace function authorize_discount_override(p_admin_email text, p_admin_password text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_admin_user_id uuid;
  v_role_key user_role_key;
begin
  select u.id into v_admin_user_id
  from auth.users u
  where u.email = p_admin_email
    and u.encrypted_password = crypt(p_admin_password, u.encrypted_password);

  if v_admin_user_id is null then
    raise exception 'invalid_credentials' using errcode = '28P01';
  end if;

  select r.key into v_role_key from profiles p join roles r on r.id = p.role_id where p.id = v_admin_user_id;
  if v_role_key is distinct from 'admin' then
    raise exception 'not_an_admin' using errcode = '42501';
  end if;

  return v_admin_user_id;
end;
$$;

--------------------------------------------------------------------------
-- create_sale: the core transactional sale-creation function.
--
-- p_items shape (jsonb array), one element per line:
--   { "product_id": uuid|null, "item_role": text, "description": text|null,
--     "quantity": int, "unit_price_ht_override": numeric|null,
--     "discount_amount": numeric|null }
-- product_id present  -> price/cost/tax pulled from the product record
--                        (client-sent price is ignored) and stock is
--                        decremented.
-- product_id null     -> a custom/service line; unit_price_ht_override is
--                        required, cost is 0, no stock movement.
--------------------------------------------------------------------------
create or replace function create_sale(
  p_customer_id uuid,
  p_items jsonb,
  p_prescription_id uuid default null,
  p_quote_id uuid default null,
  p_cart_discount_amount numeric default 0,
  p_deposit_amount numeric default 0,
  p_payment_method_id uuid default null,
  p_cash_register_id uuid default null,
  p_discount_authorized_by uuid default null,
  p_notes text default null
) returns sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_store_id uuid;
  v_sale sales%rowtype;
  v_item jsonb;
  v_product products%rowtype;
  v_quantity integer;
  v_unit_price_ht numeric;
  v_unit_cost_ht numeric;
  v_tax_rate numeric;
  v_line_discount numeric;
  v_description text;
  v_item_role text;
  v_subtotal_ht numeric := 0;
  v_items_tax numeric := 0;
  v_cost_total numeric := 0;
  v_discount_ratio numeric := 1;
  v_total_ht numeric;
  v_tax_amount numeric;
  v_total_ttc numeric;
  v_margin_amount numeric;
  v_margin_percent numeric;
  v_sale_item_id uuid;
  v_invoice invoices%rowtype;
  v_sale_number text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_profile from profiles where id = auth.uid();
  if not found or not v_profile.is_active then
    raise exception 'inactive_or_unknown_profile' using errcode = '28000';
  end if;
  v_store_id := v_profile.store_id;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'sale_must_have_at_least_one_item';
  end if;

  -- If a discount authorization was supplied, it must genuinely belong to
  -- an admin profile (its authenticity was already checked by
  -- authorize_discount_override(), this just guards against a stray id).
  if p_discount_authorized_by is not null then
    if not exists (select 1 from profiles p join roles r on r.id = p.role_id where p.id = p_discount_authorized_by and r.key = 'admin') then
      raise exception 'discount_authorized_by_must_be_admin' using errcode = '42501';
    end if;
  end if;

  v_sale_number := next_document_number(v_store_id, 'sale', true);

  insert into sales (
    store_id, sale_number, customer_id, prescription_id, quote_id, optician_id,
    discount_amount, discount_authorized_by
  ) values (
    v_store_id, v_sale_number, p_customer_id, p_prescription_id, p_quote_id, auth.uid(),
    p_cart_discount_amount, p_discount_authorized_by
  ) returning * into v_sale;

  -- Process each line item.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'invalid_item_quantity';
    end if;
    v_item_role := coalesce(v_item->>'item_role', 'produit');
    v_line_discount := coalesce((v_item->>'discount_amount')::numeric, 0);

    if (v_item->>'product_id') is not null then
      select * into v_product from products where id = (v_item->>'product_id')::uuid for update;
      if not found then
        raise exception 'product_not_found: %', v_item->>'product_id';
      end if;
      if not v_product.is_active then
        raise exception 'product_inactive: %', v_product.name;
      end if;
      if v_product.quantity < v_quantity then
        raise exception 'insufficient_stock_for_%: available % requested %', v_product.name, v_product.quantity, v_quantity;
      end if;
      v_unit_price_ht := v_product.sale_price_ht;
      v_unit_cost_ht := v_product.purchase_price_ht;
      v_tax_rate := v_product.tax_rate;
      v_description := coalesce(v_item->>'description', v_product.name);
    else
      v_unit_price_ht := (v_item->>'unit_price_ht_override')::numeric;
      if v_unit_price_ht is null then
        raise exception 'unit_price_ht_override_required_for_custom_line';
      end if;
      v_unit_cost_ht := 0;
      v_tax_rate := coalesce((v_item->>'tax_rate')::numeric, (select default_tax_rate from stores where id = v_store_id));
      v_description := coalesce(v_item->>'description', 'Article');
    end if;

    insert into sale_items (
      sale_id, product_id, item_role, description, quantity,
      unit_price_ht, unit_cost_ht, discount_amount, tax_rate
    ) values (
      v_sale.id,
      nullif(v_item->>'product_id', '')::uuid,
      v_item_role, v_description, v_quantity,
      v_unit_price_ht, v_unit_cost_ht, v_line_discount, v_tax_rate
    ) returning id into v_sale_item_id;

    if (v_item->>'product_id') is not null then
      perform apply_stock_movement(
        (v_item->>'product_id')::uuid, 'vente', -v_quantity,
        'Vente ' || v_sale_number, 'sale', v_sale.id
      );
    end if;

    v_subtotal_ht := v_subtotal_ht + round(v_unit_price_ht * v_quantity - v_line_discount, 2);
    v_items_tax := v_items_tax + round((v_unit_price_ht * v_quantity - v_line_discount) * v_tax_rate / 100, 2);
    v_cost_total := v_cost_total + round(v_unit_cost_ht * v_quantity, 2);
  end loop;

  -- Discount authorization threshold (server-side — never trust the
  -- frontend's own check). An opticien exceeding their configured max
  -- discount must supply an admin authorization obtained via
  -- authorize_discount_override().
  if v_subtotal_ht > 0 and not is_admin() then
    if (p_cart_discount_amount / v_subtotal_ht * 100) > v_profile.max_discount_percent
       and p_discount_authorized_by is null then
      raise exception 'discount_exceeds_% percent_authorization_required', v_profile.max_discount_percent
        using errcode = '42501';
    end if;
  end if;

  if v_subtotal_ht > 0 then
    v_discount_ratio := (v_subtotal_ht - p_cart_discount_amount) / v_subtotal_ht;
  end if;
  v_total_ht := round(v_subtotal_ht - p_cart_discount_amount, 2);
  v_tax_amount := round(v_items_tax * v_discount_ratio, 2);
  v_total_ttc := round(v_total_ht + v_tax_amount, 2);
  v_margin_amount := round(v_total_ht - v_cost_total, 2);
  v_margin_percent := case when v_total_ht = 0 then 0 else round(v_margin_amount / v_total_ht * 100, 2) end;

  update sales set
    subtotal_ht = v_subtotal_ht,
    tax_amount = v_tax_amount,
    total_ht = v_total_ht,
    total_ttc = v_total_ttc,
    cost_total = v_cost_total,
    margin_amount = v_margin_amount,
    margin_percent = v_margin_percent,
    discount_percent = case when v_subtotal_ht = 0 then 0 else round(p_cart_discount_amount / v_subtotal_ht * 100, 2) end,
    notes = p_notes
  where id = v_sale.id
  returning * into v_sale;

  -- Optional deposit at time of sale.
  if p_deposit_amount > 0 then
    perform record_payment(
      v_sale.id, p_deposit_amount, 'acompte', p_payment_method_id, p_cash_register_id,
      null, 'Acompte à la vente'
    );
    select * into v_sale from sales where id = v_sale.id;
  end if;

  -- Auto-generate the invoice snapshot.
  insert into invoices (
    store_id, invoice_number, sale_id, customer_id, total_ht, tax_amount,
    total_ttc, amount_paid, amount_due, issued_by
  ) values (
    v_store_id, next_document_number(v_store_id, 'invoice', true), v_sale.id, p_customer_id,
    v_sale.total_ht, v_sale.tax_amount, v_sale.total_ttc, v_sale.amount_paid, v_sale.amount_due, auth.uid()
  ) returning * into v_invoice;

  insert into invoice_items (invoice_id, description, quantity, unit_price_ht, discount_amount, tax_rate, line_total_ht, line_total_ttc)
  select v_invoice.id, si.description, si.quantity, si.unit_price_ht, si.discount_amount, si.tax_rate, si.line_total_ht, si.line_total_ttc
  from sale_items si where si.sale_id = v_sale.id;

  perform write_audit_log('sale.create', 'sales', 'sale', v_sale.id, null, to_jsonb(v_sale));

  insert into notifications (store_id, user_id, type, title, message, link)
  values (v_store_id, null, 'nouvelle_vente', 'Nouvelle vente', format('%s — %s MAD', v_sale.sale_number, v_sale.total_ttc), '/sales/' || v_sale.id);

  return v_sale;
end;
$$;

--------------------------------------------------------------------------
-- record_payment: settle a deposit / balance / full payment against a
-- sale. Updates sale.amount_paid & status, logs a cash movement and an
-- audit entry, all atomically.
--------------------------------------------------------------------------
create or replace function record_payment(
  p_sale_id uuid,
  p_amount numeric,
  p_payment_type payment_type,
  p_payment_method_id uuid,
  p_cash_register_id uuid default null,
  p_reference text default null,
  p_notes text default null
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

  insert into payments (
    payment_number, sale_id, customer_id, payment_type, amount, payment_method_id,
    cash_register_id, reference, notes, user_id
  ) values (
    next_document_number(v_sale.store_id, 'payment', true),
    p_sale_id, v_sale.customer_id, p_payment_type, p_amount, p_payment_method_id,
    p_cash_register_id, p_reference, p_notes, auth.uid()
  ) returning id into v_payment_id;

  v_new_status := case
    when v_sale.amount_paid + p_amount >= v_sale.total_ttc then 'paye'
    when v_sale.amount_paid = 0 then 'acompte'
    else 'partiellement_paye'
  end;

  update sales set amount_paid = amount_paid + p_amount, status = v_new_status
  where id = p_sale_id
  returning * into v_sale;

  if p_cash_register_id is not null then
    insert into cash_movements (cash_register_id, type, amount, payment_method_id, reference_type, reference_id, user_id, notes)
    values (
      p_cash_register_id,
      (case p_payment_type when 'acompte' then 'acompte' when 'remboursement' then 'remboursement' else 'solde' end)::cash_movement_type,
      p_amount, p_payment_method_id, 'sale', p_sale_id, auth.uid(), p_notes
    );
  end if;

  -- Keep the invoice snapshot's paid/due amounts in sync.
  update invoices set amount_paid = v_sale.amount_paid, amount_due = v_sale.amount_due
  where sale_id = p_sale_id;

  perform write_audit_log('payment.create', 'payments', 'sale', p_sale_id, to_jsonb(v_old_sale), to_jsonb(v_sale));

  return v_sale;
end;
$$;

--------------------------------------------------------------------------
-- Cash register open / close
--------------------------------------------------------------------------
create or replace function open_cash_register(p_opening_amount numeric, p_notes text default null)
returns cash_registers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_register cash_registers%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into v_profile from profiles where id = auth.uid();

  if exists (select 1 from cash_registers where store_id = v_profile.store_id and status = 'ouverte') then
    raise exception 'a_cash_register_is_already_open_for_this_store';
  end if;

  insert into cash_registers (store_id, opened_by, opening_amount, notes)
  values (v_profile.store_id, auth.uid(), p_opening_amount, p_notes)
  returning * into v_register;

  insert into cash_movements (cash_register_id, type, amount, user_id, notes)
  values (v_register.id, 'fond_ouverture', p_opening_amount, auth.uid(), 'Fond de caisse');

  perform write_audit_log('cash_register.open', 'cash', 'cash_register', v_register.id, null, to_jsonb(v_register));

  return v_register;
end;
$$;

create or replace function close_cash_register(p_cash_register_id uuid, p_actual_cash numeric, p_notes text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_register cash_registers%rowtype;
  v_old_register cash_registers%rowtype;
  v_expected_cash numeric;
  v_totals_by_method jsonb;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_register from cash_registers where id = p_cash_register_id for update;
  if not found then
    raise exception 'cash_register_not_found';
  end if;
  if v_register.status = 'cloturee' and not is_admin() then
    raise exception 'insufficient_privilege: register already closed' using errcode = '42501';
  end if;
  v_old_register := v_register;

  -- The opening float (fond_ouverture) is always physical cash by
  -- definition, regardless of payment_method_id (which is left null for
  -- it); every other movement only counts toward the cash drawer when it
  -- was actually paid in cash (payment_method 'especes').
  select coalesce(sum(
    case
      when cm.type = 'fond_ouverture' then cm.amount
      when pm.code = 'especes' and cm.type in ('vente','acompte','solde','entree') then cm.amount
      when pm.code = 'especes' and cm.type in ('remboursement','depense','sortie') then -cm.amount
      else 0
    end
  ), 0) into v_expected_cash
  from cash_movements cm
  left join payment_methods pm on pm.id = cm.payment_method_id
  where cm.cash_register_id = p_cash_register_id;

  select jsonb_object_agg(coalesce(pm.code::text, 'especes'), total) into v_totals_by_method
  from (
    select cm.payment_method_id, sum(
      case when cm.type in ('vente','acompte','solde','entree','fond_ouverture') then cm.amount else -cm.amount end
    ) as total
    from cash_movements cm
    where cm.cash_register_id = p_cash_register_id
    group by cm.payment_method_id
  ) t
  left join payment_methods pm on pm.id = t.payment_method_id;

  update cash_registers set
    status = 'cloturee',
    closed_by = auth.uid(),
    closed_at = now(),
    expected_cash = v_expected_cash,
    actual_cash = p_actual_cash,
    notes = coalesce(p_notes, notes)
  where id = p_cash_register_id
  returning * into v_register;

  perform write_audit_log('cash_register.close', 'cash', 'cash_register', v_register.id, to_jsonb(v_old_register), to_jsonb(v_register));

  return jsonb_build_object(
    'register', to_jsonb(v_register),
    'totals_by_method', coalesce(v_totals_by_method, '{}'::jsonb)
  );
end;
$$;

--------------------------------------------------------------------------
-- cancel_sale: admin-only correction path (spec #4 — admin may
-- "annuler ou corriger certaines opérations"). Reverses stock and marks
-- the sale cancelled; does not delete history.
--------------------------------------------------------------------------
create or replace function cancel_sale(p_sale_id uuid, p_reason text)
returns sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale sales%rowtype;
  v_old_sale sales%rowtype;
  v_item sale_items%rowtype;
begin
  if not is_admin() then
    raise exception 'insufficient_privilege: only admin can cancel a sale' using errcode = '42501';
  end if;

  select * into v_sale from sales where id = p_sale_id for update;
  if not found then
    raise exception 'sale_not_found';
  end if;
  if v_sale.status = 'annule' then
    raise exception 'sale_already_cancelled';
  end if;
  if v_sale.amount_paid > 0 then
    raise exception 'cannot_cancel_sale_with_payments_use_refund_first';
  end if;
  v_old_sale := v_sale;

  for v_item in select * from sale_items where sale_id = p_sale_id and product_id is not null
  loop
    perform apply_stock_movement(v_item.product_id, 'retour_client', v_item.quantity, 'Annulation ' || v_sale.sale_number, 'sale', p_sale_id);
  end loop;

  update sales set status = 'annule', cancelled_at = now(), cancelled_by = auth.uid(), cancel_reason = p_reason
  where id = p_sale_id
  returning * into v_sale;

  perform write_audit_log('sale.cancel', 'sales', 'sale', p_sale_id, to_jsonb(v_old_sale), to_jsonb(v_sale));

  return v_sale;
end;
$$;

-- ===================================================================
-- 017_grants.sql
-- ===================================================================
-- Grants for Supabase's PostgREST-facing roles.
-- `anon` gets nothing (the app requires authentication for everything);
-- `authenticated` gets table/view/sequence access gated by the RLS
-- policies defined above, and EXECUTE on the RPC functions.

grant usage on schema public to authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all sequences in schema public to authenticated;

grant execute on function auth_profile() to authenticated;
grant execute on function auth_role_key() to authenticated;
grant execute on function is_admin() to authenticated;
grant execute on function has_permission(text) to authenticated;
grant execute on function next_document_number(uuid, text, boolean) to authenticated;
grant execute on function write_audit_log(text, text, text, uuid, jsonb, jsonb) to authenticated;
grant execute on function apply_stock_movement(uuid, stock_movement_type, integer, text, text, uuid) to authenticated;
grant execute on function authorize_discount_override(text, text) to authenticated;
grant execute on function create_sale(uuid, jsonb, uuid, uuid, numeric, numeric, uuid, uuid, uuid, text) to authenticated;
grant execute on function record_payment(uuid, numeric, payment_type, uuid, uuid, text, text) to authenticated;
grant execute on function open_cash_register(numeric, text) to authenticated;
grant execute on function close_cash_register(uuid, numeric, text) to authenticated;
grant execute on function cancel_sale(uuid, text) to authenticated;

alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select on sequences to authenticated;

-- ===================================================================
-- 018_realtime.sql
-- ===================================================================
-- Enable Supabase Realtime (logical replication) for the tables the
-- frontend subscribes to, so a sale/payment/stock change made on one
-- device is pushed live to every other connected session without a
-- manual refresh (spec #37).
--
-- NOTE: Supabase projects already have the `supabase_realtime`
-- publication created for you; this just adds tables to it. If running
-- against a Supabase project, this is all you need — Realtime picks it
-- up automatically. (On a bare local Postgres this statement is a no-op
-- error if the publication doesn't exist, so local_dev test runs skip it.)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table sales;
    alter publication supabase_realtime add table sale_items;
    alter publication supabase_realtime add table payments;
    alter publication supabase_realtime add table products;
    alter publication supabase_realtime add table stock_movements;
    alter publication supabase_realtime add table cash_registers;
    alter publication supabase_realtime add table cash_movements;
    alter publication supabase_realtime add table orders;
    alter publication supabase_realtime add table notifications;
    alter publication supabase_realtime add table customers;
  end if;
end $$;

-- ===================================================================
-- 019_credits_and_quote_conversion.sql
-- ===================================================================
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

-- ===================================================================
-- 020_quote_totals.sql
-- ===================================================================
-- Quotes need the same "never trust the frontend for totals" guarantee as
-- sales (spec #57), but unlike create_sale() a quote is built line-by-line
-- via plain INSERTs into quote_items (RLS already allows this for any
-- authenticated user), so there's no single RPC call to hang the
-- computation off. Instead, recompute the quote's totals with a trigger
-- every time its items change.

create or replace function recompute_quote_totals(p_quote_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quote quotes%rowtype;
  v_subtotal_ht numeric := 0;
  v_items_tax numeric := 0;
  v_discount_ratio numeric := 1;
  v_total_ht numeric;
  v_tax_amount numeric;
begin
  select * into v_quote from quotes where id = p_quote_id for update;
  if not found then
    return;
  end if;

  select
    coalesce(sum(round(qi.unit_price_ht * qi.quantity - qi.discount_amount, 2)), 0),
    coalesce(sum(round((qi.unit_price_ht * qi.quantity - qi.discount_amount) * qi.tax_rate / 100, 2)), 0)
  into v_subtotal_ht, v_items_tax
  from quote_items qi where qi.quote_id = p_quote_id;

  if v_subtotal_ht > 0 then
    v_discount_ratio := greatest(v_subtotal_ht - v_quote.discount_amount, 0) / v_subtotal_ht;
  end if;
  v_total_ht := round(v_subtotal_ht - v_quote.discount_amount, 2);
  v_tax_amount := round(v_items_tax * v_discount_ratio, 2);

  update quotes set
    subtotal_ht = v_subtotal_ht,
    tax_amount = v_tax_amount,
    total_ht = v_total_ht,
    total_ttc = round(v_total_ht + v_tax_amount, 2)
  where id = p_quote_id;
end;
$$;

create or replace function trg_recompute_quote_totals_from_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform recompute_quote_totals(old.quote_id);
    return old;
  else
    perform recompute_quote_totals(new.quote_id);
    return new;
  end if;
end;
$$;

create trigger trg_quote_items_recompute
  after insert or update or delete on quote_items
  for each row execute function trg_recompute_quote_totals_from_items();

-- Cart-level discount changes on a quote go through this RPC so the
-- totals recompute atomically with the discount change (kept out of a
-- trigger on quotes itself to avoid update-triggers-update recursion).
create or replace function update_quote_discount(p_quote_id uuid, p_discount_amount numeric)
returns quotes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quote quotes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_discount_amount < 0 then
    raise exception 'discount_amount_must_be_non_negative';
  end if;

  update quotes set discount_amount = p_discount_amount where id = p_quote_id;
  perform recompute_quote_totals(p_quote_id);

  select * into v_quote from quotes where id = p_quote_id;
  return v_quote;
end;
$$;

grant execute on function update_quote_discount(uuid, numeric) to authenticated;

-- ===================================================================
-- 021_quote_item_price_integrity.sql
-- ===================================================================
-- quote_items are inserted directly by the client (there's no create_sale-
-- style RPC for quotes, since a quote is just a non-binding draft built
-- incrementally). That means, unlike sale_items, nothing stops a client
-- from sending an arbitrary unit_price_ht for a catalog product. Close
-- that gap the same way create_sale() does: when a quote_item references
-- a real product, its price/tax are always pulled server-side from the
-- product record, never trusted from the client. Only fully custom lines
-- (product_id null) keep a client-supplied price.

create or replace function enforce_quote_item_pricing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
begin
  if new.product_id is not null then
    select * into v_product from products where id = new.product_id;
    if not found then
      raise exception 'product_not_found: %', new.product_id;
    end if;
    new.unit_price_ht := v_product.sale_price_ht;
    new.tax_rate := v_product.tax_rate;
    if new.description is null then
      new.description := v_product.name;
    end if;
  elsif new.unit_price_ht is null then
    raise exception 'unit_price_ht_required_for_custom_quote_line';
  end if;
  return new;
end;
$$;

create trigger trg_quote_items_pricing
  before insert or update on quote_items
  for each row execute function enforce_quote_item_pricing();

-- ===================================================================
-- 022_expense_cash_integration.sql
-- ===================================================================
-- Expenses paid out of the physical cash drawer must show up in the
-- register's movements (spec #20's "sorties de caisse"), the same way a
-- sale or payment does. A plain client-side INSERT into expenses can't
-- also atomically write the cash_movements row, so route it through an
-- RPC — consistent with every other financial write in this schema.
--
-- Expenses not paid from the register (e.g. bank transfer for rent) skip
-- p_cash_register_id and just insert the expense record directly (the
-- existing RLS policy already allows that for any authenticated user).

create or replace function record_expense(
  p_category_id uuid,
  p_amount_ht numeric,
  p_tax_amount numeric,
  p_payment_method_id uuid default null,
  p_cash_register_id uuid default null,
  p_supplier_id uuid default null,
  p_comment text default null,
  p_receipt_url text default null,
  p_expense_date date default current_date
) returns expenses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_expense expenses%rowtype;
  v_register cash_registers%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_amount_ht <= 0 then
    raise exception 'expense_amount_must_be_positive';
  end if;

  select * into v_profile from profiles where id = auth.uid();

  if p_cash_register_id is not null then
    if p_payment_method_id is null then
      raise exception 'payment_method_required_when_paying_from_cash_register';
    end if;
    select * into v_register from cash_registers where id = p_cash_register_id for update;
    if not found or v_register.status <> 'ouverte' then
      raise exception 'cash_register_not_open';
    end if;
  end if;

  insert into expenses (
    store_id, category_id, supplier_id, expense_date, amount_ht, tax_amount,
    payment_method_id, receipt_url, user_id, comment
  ) values (
    v_profile.store_id, p_category_id, p_supplier_id, p_expense_date, p_amount_ht, p_tax_amount,
    p_payment_method_id, p_receipt_url, auth.uid(), p_comment
  ) returning * into v_expense;

  if p_cash_register_id is not null then
    insert into cash_movements (cash_register_id, type, amount, payment_method_id, reference_type, reference_id, user_id, notes)
    values (p_cash_register_id, 'depense', v_expense.amount_ttc, p_payment_method_id, 'expense', v_expense.id, auth.uid(), p_comment);
  end if;

  perform write_audit_log('expense.create', 'expenses', 'expense', v_expense.id, null, to_jsonb(v_expense));

  return v_expense;
end;
$$;

grant execute on function record_expense(uuid, numeric, numeric, uuid, uuid, uuid, text, text, date) to authenticated;

-- Direct INSERT stays available for expenses not tied to the cash
-- register (kept from 010_expenses_revenues.sql's original policy), but
-- writes that DO reference a cash_register_id must go through the RPC so
-- the movement is never silently skipped.

-- ===================================================================
-- 023_lens_order_sheets.sql
-- ===================================================================
-- Lens technical order sheet ("fiche technique verres") — filled by the
-- optician when a sale includes lenses to be fabricated/ordered from a
-- lens supplier. One sheet per sale; the frame is not duplicated here —
-- it's read from the sale's own monture line item (sale_items) by the
-- frontend, matching "frame: retrieved from the frame selected via the
-- file number" (the file = the sale).

create type lens_sheet_category as enum ('homme_adulte', 'femme_adulte', 'homme_enfant', 'femme_enfant');
create type lens_sheet_type as enum ('standard', 'aminci', 'super_aminci', 'extra_aminci');
create type lens_sheet_material as enum ('organique', 'mineral', 'polycarbonate');
create type lens_sheet_finish as enum ('clair', 'anti_reflet', 'lumiere_bleue', 'photochromique', 'transitions', 'teinte');
create type lens_sheet_vision as enum ('loin', 'pres', 'intermediaire', 'progressif');

create table lens_order_sheets (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null unique references sales(id) on delete cascade,
  file_number text not null,
  order_date date not null default current_date,
  estimated_delivery_date date,

  category lens_sheet_category,
  lens_type lens_sheet_type,
  material lens_sheet_material,

  finish lens_sheet_finish,
  tint_category text, -- a, b, c, d, td — only meaningful when finish = 'teinte'
  tint_color text,    -- bleu, vert, gris, tsm — only meaningful when finish = 'teinte'

  lens_index text,       -- '1.50', '1.56', '1.60', '1.67', '1.74', 'autre'
  lens_index_other text, -- free text when lens_index = 'autre'
  diameter text,         -- '50'..'90', 'autre'
  diameter_other text,   -- free text when diameter = 'autre'

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

create index idx_lens_order_sheets_supplier on lens_order_sheets(supplier_id);

alter table lens_order_sheets enable row level security;

create policy lens_order_sheets_read on lens_order_sheets for select using (auth.uid() is not null);
create policy lens_order_sheets_insert on lens_order_sheets for insert with check (auth.uid() is not null);
create policy lens_order_sheets_update on lens_order_sheets for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy lens_order_sheets_delete on lens_order_sheets for delete using (is_admin());

create trigger trg_lens_order_sheets_updated_at before update on lens_order_sheets
  for each row execute function set_updated_at();

-- ===================================================================
-- 024_notification_read_tracking.sql
-- ===================================================================
-- Per-user "last seen" marker for notifications.
--
-- Every notification currently inserted (nouvelle_vente, stock_faible, ...)
-- is a store-wide broadcast (notifications.user_id is null), and the
-- existing notifications.is_read column is a single shared flag — flipping
-- it when one optician opens the bell would hide the notification for
-- every other optician in the store too, which is wrong. Instead each
-- profile independently remembers when they last opened the bell; a
-- notification is "unread" for a given user simply if it was created after
-- their own last-seen timestamp. This needs no RPC: profiles_self_update
-- already lets a user update their own non-role_id columns.

alter table profiles add column notifications_last_seen_at timestamptz;

-- ===================================================================
-- 025_supplier_categories.sql
-- ===================================================================
-- What a supplier deals in — a supplier can supply more than one kind of
-- product (e.g. an optical wholesaler selling both frames and sunglasses),
-- so this is an array rather than a single category.

create type supplier_category as enum (
  'monture_optique', 'monture_solaire', 'lentilles', 'accessoires', 'autres'
);

alter table suppliers add column categories supplier_category[] not null default '{}';

-- ===================================================================
-- 026_cheques.sql
-- ===================================================================
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

-- ===================================================================
-- seed/001_base_seed.sql
-- ===================================================================
-- Base seed: roles, permissions, one store, payment methods, expense
-- categories, product categories. Required before any real usage
-- (including the demo dataset in seed/002_demo_data.sql).

insert into roles (key, name, description) values
  ('admin', 'Administrateur', 'Accès complet à l''application'),
  ('opticien', 'Opticien', 'Accès opérationnel quotidien')
on conflict (key) do nothing;

insert into permissions (key, description) values
  ('settings.accounting.edit', 'Modifier les paramètres comptables critiques'),
  ('products.cost.edit', 'Modifier les coûts d''achat'),
  ('reports.financial.view', 'Consulter les données financières réservées'),
  ('users.manage', 'Gérer les utilisateurs'),
  ('backups.manage', 'Gérer les sauvegardes')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p where r.key = 'admin'
on conflict do nothing;

insert into stores (id, name, address, phone, email, ice, currency, default_tax_rate)
values ('00000000-0000-0000-0000-000000000001', 'Optimum Optic', 'Rabat, Maroc', '+212 5 00 00 00 00', 'contact@optimumoptic.com', '000000000000000', 'MAD', 20.00)
on conflict (id) do nothing;

insert into payment_methods (code, name) values
  ('especes', 'Espèces'),
  ('carte', 'Carte bancaire'),
  ('virement', 'Virement'),
  ('cheque', 'Chèque'),
  ('mobile', 'Paiement mobile'),
  ('autre', 'Autre')
on conflict (code) do nothing;

insert into expense_categories (name) values
  ('Loyer'), ('Salaires'), ('Fournisseurs'), ('Électricité'), ('Eau'),
  ('Internet'), ('Marketing'), ('Transport'), ('Entretien'), ('Matériel'),
  ('Taxes'), ('Autres')
on conflict (name) do nothing;

insert into product_categories (name, group_key) values
  ('Optique Homme', 'optique_homme'),
  ('Optique Femme', 'optique_femme'),
  ('Optique Enfant', 'optique_enfant'),
  ('Solaire Homme', 'solaire_homme'),
  ('Solaire Femme', 'solaire_femme'),
  ('Solaire Enfant', 'solaire_enfant'),
  ('Sport', 'sport'),
  ('Premium', 'premium'),
  ('Autres', 'autres')
on conflict do nothing;
