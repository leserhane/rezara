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
