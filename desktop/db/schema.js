// Local SQLite schema for the offline desktop edition — mirrors the cloud
// Postgres schema (database/setup_supabase.sql) table-for-table so the
// exact same frontend query shapes (`.from('table').select(...)`) work
// unmodified against either backend. Differences are just dialect:
// uuid -> TEXT (generated in JS), timestamptz/date -> TEXT (ISO 8601,
// which sorts and compares correctly as plain text), numeric -> REAL,
// boolean -> INTEGER 0/1, text[] and jsonb -> TEXT (JSON-encoded),
// enums -> TEXT with a CHECK constraint. No RLS: every permission check
// enforced server-side by Postgres policies there is enforced by the
// local RPC functions here instead (see rpcs.js) — the query builder
// itself trusts the caller, same as any other embedded desktop app.

const SCHEMA_SQL = `
create table if not exists roles (
  id text primary key,
  key text not null unique check (key in ('admin','opticien')),
  name text not null,
  description text,
  created_at text not null default (datetime('now'))
);

create table if not exists stores (
  id text primary key,
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
  default_tax_rate real not null default 20.00,
  created_at text not null default (datetime('now'))
);

create table if not exists store_settings (
  store_id text primary key references stores(id) on delete cascade,
  invoice_number_prefix text not null default 'FAC',
  sale_number_prefix text not null default 'VTE',
  quote_number_prefix text not null default 'DEV',
  order_number_prefix text not null default 'CMD',
  payment_number_prefix text not null default 'PAY',
  customer_number_prefix text not null default 'CL',
  expense_number_prefix text not null default 'DEP',
  opticien_max_discount_percent real not null default 10.00,
  vip_bronze_threshold real not null default 0,
  vip_silver_threshold real not null default 5000,
  vip_gold_threshold real not null default 15000,
  vip_platinum_threshold real not null default 30000,
  inactive_customer_months integer not null default 18,
  updated_at text not null default (datetime('now'))
);

create table if not exists document_sequences (
  store_id text not null references stores(id) on delete cascade,
  doc_type text not null,
  year integer not null default 0,
  last_value integer not null default 0,
  primary key (store_id, doc_type, year)
);

create table if not exists profiles (
  id text primary key,
  store_id text not null references stores(id),
  role_id text not null references roles(id),
  first_name text not null,
  last_name text not null,
  phone text,
  password_hash text,
  is_active integer not null default 1,
  max_discount_percent real not null default 10.00,
  notifications_last_seen_at text,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists brands (
  id text primary key,
  name text not null unique,
  logo_url text,
  is_active integer not null default 1,
  created_at text not null default (datetime('now'))
);

create table if not exists suppliers (
  id text primary key,
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
  categories text not null default '[]',
  is_active integer not null default 1,
  created_at text not null default (datetime('now'))
);

create table if not exists product_categories (
  id text primary key,
  name text not null,
  group_key text not null default 'autres',
  parent_id text references product_categories(id) on delete set null,
  created_at text not null default (datetime('now'))
);

create table if not exists payment_methods (
  id text primary key,
  code text not null unique check (code in ('especes','carte','virement','cheque','mobile','autre')),
  name text not null,
  is_active integer not null default 1
);

create table if not exists expense_categories (
  id text primary key,
  name text not null unique,
  is_active integer not null default 1
);

create table if not exists customers (
  id text primary key,
  store_id text not null references stores(id),
  customer_number text not null unique,
  first_name text not null,
  last_name text not null,
  phone text,
  whatsapp text,
  email text,
  address text,
  birth_date text,
  gender text check (gender in ('homme','femme','autre')),
  notes text,
  tags text not null default '[]',
  assigned_optician_id text references profiles(id) on delete set null,
  created_by text references profiles(id) on delete set null,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists customer_notes (
  id text primary key,
  customer_id text not null references customers(id) on delete cascade,
  note text not null,
  type text not null default 'autre' check (type in ('appel','visite','email','whatsapp','sms','autre')),
  created_by text references profiles(id) on delete set null,
  created_at text not null default (datetime('now'))
);

create table if not exists prescriptions (
  id text primary key,
  customer_id text not null references customers(id) on delete cascade,
  od_sphere real, od_cylinder real, od_axis integer, od_addition real, od_prism real, od_base text, od_acuity text,
  og_sphere real, og_cylinder real, og_axis integer, og_addition real, og_prism real, og_base text, og_acuity text,
  pd real,
  height real,
  correction_type text,
  vision_far_notes text,
  vision_intermediate_notes text,
  vision_near_notes text,
  prescription_date text not null default (date('now')),
  doctor_name text,
  valid_until text,
  file_url text,
  created_by text references profiles(id) on delete set null,
  created_at text not null default (datetime('now'))
);

create table if not exists products (
  id text primary key,
  store_id text not null references stores(id),
  type text not null check (type in ('monture','verre','lentille','accessoire')),
  sku text not null unique,
  supplier_sku text,
  barcode text unique,
  name text not null,
  brand_id text references brands(id) on delete set null,
  category_id text references product_categories(id) on delete set null,
  supplier_id text references suppliers(id) on delete set null,
  photo_url text,
  purchase_price_ht real not null default 0,
  sale_price_ht real not null default 0,
  tax_rate real not null default 20.00,
  sale_price_ttc real generated always as (round(sale_price_ht * (1 + tax_rate / 100.0), 2)) stored,
  margin_amount real generated always as (round(sale_price_ht - purchase_price_ht, 2)) stored,
  margin_percent real generated always as (
    case when sale_price_ht = 0 then 0
    else round((sale_price_ht - purchase_price_ht) / sale_price_ht * 100.0, 2) end
  ) stored,
  quantity integer not null default 0,
  stock_min integer not null default 0,
  stock_max integer,
  location text,
  is_active integer not null default 1,
  created_by text references profiles(id) on delete set null,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists frame_details (
  product_id text primary key references products(id) on delete cascade,
  collection text, color text, size text, shape text,
  gender text check (gender in ('homme','femme','autre')),
  material text
);

create table if not exists lens_details (
  product_id text primary key references products(id) on delete cascade,
  verrier text, lens_type text, material text, refractive_index real,
  sphere real, cylinder real, addition real, treatment text, tint text, diameter real
);

create table if not exists contact_lens_details (
  product_id text primary key references products(id) on delete cascade,
  range_name text, wear_type text, lens_kind text, diameter real, base_curve real,
  power real, cylinder real, axis integer, addition real, material text
);

create table if not exists stock_movements (
  id text primary key,
  product_id text not null references products(id) on delete restrict,
  type text not null check (type in ('entree','sortie','transfert','ajustement','retour_fournisseur','retour_client','vente','inventaire')),
  quantity_change integer not null,
  previous_quantity integer not null,
  new_quantity integer not null,
  reason text,
  reference_type text,
  reference_id text,
  user_id text references profiles(id) on delete set null,
  created_at text not null default (datetime('now'))
);

create table if not exists inventories (
  id text primary key,
  store_id text not null references stores(id),
  reference text not null unique,
  status text not null default 'en_cours',
  started_by text references profiles(id) on delete set null,
  started_at text not null default (datetime('now')),
  validated_by text references profiles(id) on delete set null,
  validated_at text,
  notes text
);

create table if not exists inventory_items (
  id text primary key,
  inventory_id text not null references inventories(id) on delete cascade,
  product_id text not null references products(id) on delete restrict,
  theoretical_quantity integer not null,
  counted_quantity integer,
  difference integer generated always as (coalesce(counted_quantity, 0) - theoretical_quantity) stored,
  counted_by text references profiles(id) on delete set null,
  counted_at text
);

create table if not exists quotes (
  id text primary key,
  store_id text not null references stores(id),
  quote_number text not null unique,
  customer_id text not null references customers(id) on delete restrict,
  prescription_id text references prescriptions(id) on delete set null,
  optician_id text not null references profiles(id) on delete restrict,
  status text not null default 'brouillon' check (status in ('brouillon','envoye','accepte','refuse','expire','transforme')),
  subtotal_ht real not null default 0,
  discount_amount real not null default 0,
  tax_amount real not null default 0,
  total_ht real not null default 0,
  total_ttc real not null default 0,
  valid_until text,
  converted_sale_id text,
  notes text,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists quote_items (
  id text primary key,
  quote_id text not null references quotes(id) on delete cascade,
  product_id text references products(id) on delete restrict,
  item_role text not null default 'produit',
  description text,
  quantity integer not null default 1,
  unit_price_ht real not null default 0,
  discount_amount real not null default 0,
  tax_rate real not null default 20.00,
  line_total_ht real generated always as (round(unit_price_ht * quantity - discount_amount, 2)) stored,
  line_total_ttc real generated always as (round((unit_price_ht * quantity - discount_amount) * (1 + tax_rate / 100.0), 2)) stored
);

create table if not exists sales (
  id text primary key,
  store_id text not null references stores(id),
  sale_number text not null unique,
  customer_id text not null references customers(id) on delete restrict,
  prescription_id text references prescriptions(id) on delete set null,
  quote_id text references quotes(id) on delete set null,
  optician_id text not null references profiles(id) on delete restrict,
  subtotal_ht real not null default 0,
  discount_amount real not null default 0,
  discount_percent real not null default 0,
  discount_authorized_by text references profiles(id) on delete set null,
  tax_amount real not null default 0,
  total_ht real not null default 0,
  total_ttc real not null default 0,
  cost_total real not null default 0,
  margin_amount real not null default 0,
  margin_percent real not null default 0,
  amount_paid real not null default 0,
  amount_due real generated always as (round(total_ttc - amount_paid, 2)) stored,
  status text not null default 'non_paye' check (status in ('non_paye','acompte','partiellement_paye','paye','credit','annule')),
  notes text,
  cancelled_at text,
  cancelled_by text references profiles(id) on delete set null,
  cancel_reason text,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists sale_items (
  id text primary key,
  sale_id text not null references sales(id) on delete cascade,
  product_id text references products(id) on delete restrict,
  item_role text not null default 'produit',
  description text,
  quantity integer not null default 1,
  unit_price_ht real not null default 0,
  unit_cost_ht real not null default 0,
  discount_amount real not null default 0,
  tax_rate real not null default 20.00,
  line_total_ht real generated always as (round(unit_price_ht * quantity - discount_amount, 2)) stored,
  line_total_ttc real generated always as (round((unit_price_ht * quantity - discount_amount) * (1 + tax_rate / 100.0), 2)) stored,
  line_cost_total real generated always as (round(unit_cost_ht * quantity, 2)) stored,
  line_margin real generated always as (round((unit_price_ht * quantity - discount_amount) - (unit_cost_ht * quantity), 2)) stored
);

create table if not exists cash_registers (
  id text primary key,
  store_id text not null references stores(id),
  opened_by text not null references profiles(id) on delete restrict,
  opened_at text not null default (datetime('now')),
  opening_amount real not null default 0,
  closed_by text references profiles(id) on delete set null,
  closed_at text,
  expected_cash real,
  actual_cash real,
  cash_difference real generated always as (actual_cash - expected_cash) stored,
  status text not null default 'ouverte' check (status in ('ouverte','cloturee')),
  notes text
);

create table if not exists cash_movements (
  id text primary key,
  cash_register_id text not null references cash_registers(id) on delete restrict,
  type text not null check (type in ('vente','acompte','solde','remboursement','depense','entree','sortie','fond_ouverture')),
  amount real not null,
  payment_method_id text references payment_methods(id),
  reference_type text,
  reference_id text,
  user_id text references profiles(id) on delete set null,
  notes text,
  created_at text not null default (datetime('now'))
);

create table if not exists payments (
  id text primary key,
  payment_number text not null unique,
  sale_id text references sales(id) on delete restrict,
  credit_installment_id text,
  customer_id text not null references customers(id) on delete restrict,
  payment_type text not null check (payment_type in ('acompte','solde','paiement_total','echeance_credit','remboursement')),
  amount real not null check (amount > 0),
  payment_method_id text not null references payment_methods(id),
  cash_register_id text references cash_registers(id) on delete set null,
  reference text,
  notes text,
  user_id text not null references profiles(id) on delete restrict,
  created_at text not null default (datetime('now'))
);

create table if not exists credits (
  id text primary key,
  sale_id text not null references sales(id) on delete restrict,
  customer_id text not null references customers(id) on delete restrict,
  initial_amount real not null,
  paid_amount real not null default 0,
  balance real generated always as (round(initial_amount - paid_amount, 2)) stored,
  due_date text,
  frequency text,
  status text not null default 'actif' check (status in ('actif','solde','en_retard')),
  created_at text not null default (datetime('now'))
);

create table if not exists credit_installments (
  id text primary key,
  credit_id text not null references credits(id) on delete cascade,
  due_date text not null,
  amount real not null,
  paid_amount real not null default 0,
  status text not null default 'en_attente',
  paid_at text
);

create table if not exists invoices (
  id text primary key,
  store_id text not null references stores(id),
  invoice_number text not null unique,
  sale_id text not null references sales(id) on delete restrict,
  customer_id text not null references customers(id) on delete restrict,
  issued_at text not null default (datetime('now')),
  total_ht real not null,
  tax_amount real not null,
  total_ttc real not null,
  amount_paid real not null,
  amount_due real not null,
  issued_by text not null references profiles(id) on delete restrict
);

create table if not exists invoice_items (
  id text primary key,
  invoice_id text not null references invoices(id) on delete cascade,
  description text not null,
  quantity integer not null,
  unit_price_ht real not null,
  discount_amount real not null default 0,
  tax_rate real not null,
  line_total_ht real not null,
  line_total_ttc real not null
);

create table if not exists orders (
  id text primary key,
  store_id text not null references stores(id),
  order_number text not null unique,
  sale_id text not null references sales(id) on delete restrict,
  customer_id text not null references customers(id) on delete restrict,
  supplier_id text references suppliers(id) on delete set null,
  status text not null default 'creee' check (status in ('creee','verres_commandes','en_attente','recue','montage','controle','prete','client_informe','livree','annulee')),
  expected_date text,
  notes text,
  created_by text references profiles(id) on delete set null,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists order_items (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  sale_item_id text references sale_items(id) on delete set null,
  description text not null,
  quantity integer not null default 1,
  status text not null default 'creee'
);

create table if not exists order_status_history (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by text references profiles(id) on delete set null,
  changed_at text not null default (datetime('now')),
  notes text
);

create table if not exists deliveries (
  id text primary key,
  order_id text references orders(id) on delete set null,
  sale_id text not null references sales(id) on delete restrict,
  status text not null default 'en_preparation' check (status in ('en_preparation','prete','livree')),
  delivered_at text,
  delivered_by text references profiles(id) on delete set null,
  received_by_name text,
  signature_url text,
  notes text,
  created_at text not null default (datetime('now'))
);

create table if not exists expenses (
  id text primary key,
  store_id text not null references stores(id),
  expense_number text not null unique,
  category_id text not null references expense_categories(id) on delete restrict,
  supplier_id text references suppliers(id) on delete set null,
  expense_date text not null default (date('now')),
  amount_ht real not null,
  tax_amount real not null default 0,
  amount_ttc real generated always as (amount_ht + tax_amount) stored,
  payment_method_id text references payment_methods(id),
  receipt_url text,
  user_id text not null references profiles(id) on delete restrict,
  comment text,
  created_at text not null default (datetime('now'))
);

create table if not exists revenues (
  id text primary key,
  store_id text not null references stores(id),
  revenue_date text not null default (date('now')),
  source text not null,
  amount real not null,
  notes text,
  user_id text not null references profiles(id) on delete restrict,
  created_at text not null default (datetime('now'))
);

create table if not exists promotions (
  id text primary key,
  store_id text not null references stores(id),
  name text not null,
  discount_type text not null default 'percent',
  discount_value real not null,
  applies_to text not null default 'panier',
  product_id text references products(id) on delete cascade,
  category_id text references product_categories(id) on delete cascade,
  starts_at text,
  ends_at text,
  is_active integer not null default 1,
  created_at text not null default (datetime('now'))
);

create table if not exists appointments (
  id text primary key,
  store_id text not null references stores(id),
  customer_id text not null references customers(id) on delete cascade,
  optician_id text references profiles(id) on delete set null,
  scheduled_at text not null,
  reason text,
  status text not null default 'planifie' check (status in ('planifie','confirme','realise','annule','absent')),
  notes text,
  created_by text references profiles(id) on delete set null,
  created_at text not null default (datetime('now'))
);

create table if not exists notifications (
  id text primary key,
  store_id text not null references stores(id),
  user_id text references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  link text,
  is_read integer not null default 0,
  created_at text not null default (datetime('now'))
);

create table if not exists audit_logs (
  id text primary key,
  user_id text references profiles(id) on delete set null,
  action text not null,
  module text not null,
  entity_type text not null,
  entity_id text,
  old_value text,
  new_value text,
  created_at text not null default (datetime('now'))
);

create table if not exists lens_order_sheets (
  id text primary key,
  sale_id text not null unique references sales(id) on delete cascade,
  file_number text not null,
  order_date text not null default (date('now')),
  estimated_delivery_date text,
  category text, lens_type text, material text,
  finish text, tint_category text, tint_color text,
  lens_index text, lens_index_other text, diameter text, diameter_other text,
  vision_type text,
  od_sphere real, od_cylinder real, od_axis integer, od_addition real, od_prism real, od_base text, od_pd real, od_height real,
  og_sphere real, og_cylinder real, og_axis integer, og_addition real, og_prism real, og_base text, og_pd real, og_height real,
  supplier_id text references suppliers(id) on delete set null,
  notes text,
  created_by text references profiles(id) on delete set null,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists cheques (
  id text primary key,
  store_id text not null references stores(id),
  sale_id text not null references sales(id) on delete restrict,
  customer_id text not null references customers(id) on delete restrict,
  payment_id text references payments(id) on delete set null,
  cheque_number text,
  bank_name text,
  amount real not null check (amount > 0),
  due_date text not null,
  status text not null default 'en_attente' check (status in ('en_attente','encaisse','rejete')),
  cashed_at text,
  reject_reason text,
  notes text,
  created_by text references profiles(id) on delete set null,
  created_at text not null default (datetime('now'))
);

create index if not exists idx_customers_name on customers(first_name, last_name);
create index if not exists idx_customer_notes_customer on customer_notes(customer_id, created_at desc);
create index if not exists idx_products_active on products(is_active);
create index if not exists idx_stock_movements_product on stock_movements(product_id);
create index if not exists idx_sales_customer on sales(customer_id);
create index if not exists idx_sales_optician on sales(optician_id);
create index if not exists idx_sale_items_sale on sale_items(sale_id);
create index if not exists idx_payments_sale on payments(sale_id);
create index if not exists idx_appointments_customer on appointments(customer_id);
create index if not exists idx_inventory_items_inventory on inventory_items(inventory_id);

-- v_products/v_low_stock_products/v_sales/v_sale_items are NOT SQLite
-- views here (unlike the cloud schema) — their admin-only column gating
-- depends on the currently active session, which a static view can't see,
-- and routing it through a registered SQL function hits better-sqlite3's
-- "database busy" reentrancy limit when that function queries the DB
-- itself mid-SELECT. db/queryEngine.js handles those four as the real
-- table plus a JS post-processing gate instead (see ADMIN_GATED_VIEWS).
create view if not exists v_customer_stats as
select
  c.id as customer_id,
  c.store_id,
  count(s.id) as purchase_count,
  coalesce(sum(s.total_ttc), 0) as lifetime_value,
  coalesce(avg(s.total_ttc), 0) as average_basket,
  max(s.created_at) as last_purchase_at,
  coalesce(sum(case when s.status not in ('annule','paye') then s.amount_due else 0 end), 0) as balance_due,
  case
    when coalesce(sum(s.total_ttc), 0) >= (select vip_platinum_threshold from store_settings where store_id = c.store_id) then 'vip'
    when coalesce(sum(s.total_ttc), 0) >= (select vip_gold_threshold from store_settings where store_id = c.store_id) then 'gold'
    when coalesce(sum(s.total_ttc), 0) >= (select vip_silver_threshold from store_settings where store_id = c.store_id) then 'silver'
    else 'bronze'
  end as vip_tier
from customers c
left join sales s on s.customer_id = c.id and s.status <> 'annule'
group by c.id, c.store_id;
`

module.exports = { SCHEMA_SQL }
