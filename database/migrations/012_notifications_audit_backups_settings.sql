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
