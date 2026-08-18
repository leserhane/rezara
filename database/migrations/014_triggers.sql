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
