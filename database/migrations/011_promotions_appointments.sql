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
