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
