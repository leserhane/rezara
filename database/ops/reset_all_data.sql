-- Full data reset for Optimum Optic — wipes every business and catalog
-- table, keeps only accounts/roles/store configuration intact.
--
-- KEPT:    profiles, roles, permissions, role_permissions, stores,
--          store_settings, payment_methods, expense_categories
-- WIPED:   everything else, including the product catalog, suppliers,
--          brands, and product_categories
-- RESET:   document_sequences is cleared too, so the next sale/invoice/
--          quote/customer number starts back at 1
--
-- Any table in the list below that doesn't exist yet on this project (a
-- migration not applied yet) is silently skipped instead of erroring out
-- the whole script.
--
-- THIS IS IRREVERSIBLE. There is no undo once this commits. If you want a
-- copy of what's about to be deleted, use Paramètres → Export des données
-- (CSV) in the app FIRST, before running this.

begin;

do $$
declare
  v_tables text[] := array[
    'brands', 'suppliers', 'product_categories',
    'products', 'frame_details', 'lens_details', 'contact_lens_details',
    'stock_movements', 'inventories', 'inventory_items',
    'customers', 'customer_notes', 'prescriptions',
    'quotes', 'quote_items',
    'sales', 'sale_items',
    'invoices', 'invoice_items',
    'orders', 'order_items', 'order_status_history',
    'deliveries',
    'cash_registers', 'cash_movements',
    'payments', 'credits', 'credit_installments', 'cheques',
    'expenses', 'revenues',
    'promotions', 'appointments', 'notifications', 'audit_logs', 'backups',
    'lens_order_sheets',
    'document_sequences'
  ];
  v_existing text[] := '{}';
  t text;
begin
  foreach t in array v_tables loop
    if to_regclass('public.' || t) is not null then
      v_existing := array_append(v_existing, t);
    end if;
  end loop;

  if array_length(v_existing, 1) > 0 then
    execute 'truncate table ' || array_to_string(v_existing, ', ') || ' restart identity cascade';
  end if;

  raise notice 'Truncated % table(s): %', array_length(v_existing, 1), array_to_string(v_existing, ', ');
end $$;

commit;

-- Confirm: every wiped table should show 0, the kept ones should still
-- have your accounts/config.
select 'customers' as table_name, count(*) from customers
union all select 'products', count(*) from products
union all select 'sales', count(*) from sales
union all select 'invoices', count(*) from invoices
union all select 'suppliers', count(*) from suppliers
union all select 'profiles (kept)', count(*) from profiles
union all select 'stores (kept)', count(*) from stores
union all select 'payment_methods (kept)', count(*) from payment_methods;
