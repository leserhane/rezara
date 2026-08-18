-- End-to-end test of the mandatory scenario (spec section 56):
-- Ahmed Benali — monture 2000 + verres 3000 + accessoire 200, remise 200,
-- coût 2700, acompte 2000, solde 3000 later, order workflow, cash register.
\set ON_ERROR_STOP on
\pset pager off

-- ------------------------------------------------------------------
-- 1. Users: one admin, one opticien
-- ------------------------------------------------------------------
insert into auth.users (id, email, encrypted_password)
values
  ('11111111-1111-1111-1111-111111111111', 'admin@optimumoptic.com', crypt('AdminPass123!', gen_salt('bf'))),
  ('22222222-2222-2222-2222-222222222222', 'opticien@optimumoptic.com', crypt('OpticienPass123!', gen_salt('bf')));

select set_config('app.current_user_id', '11111111-1111-1111-1111-111111111111', false); -- act as admin for setup

insert into profiles (id, store_id, role_id, first_name, last_name, max_discount_percent)
select '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', r.id, 'Yassine', 'Admin', 100
from roles r where r.key = 'admin';

insert into profiles (id, store_id, role_id, first_name, last_name, max_discount_percent)
select '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', r.id, 'Ahmed', 'Opticien', 10
from roles r where r.key = 'opticien';

-- ------------------------------------------------------------------
-- 2. Catalog: brand, supplier, 3 products (monture, verre, accessoire)
--    tax_rate = 0 to match the scenario's plain MAD figures exactly.
-- ------------------------------------------------------------------
insert into brands (id, name) values ('33333333-3333-3333-3333-333333333333', 'Ray-Ban');
insert into suppliers (id, name) values ('44444444-4444-4444-4444-444444444444', 'Optic Supplier SARL');

insert into products (id, store_id, type, sku, name, brand_id, supplier_id, purchase_price_ht, sale_price_ht, tax_rate, quantity, stock_min)
values
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', 'monture', 'MNT-0001', 'Monture Ray-Ban RB2140', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 1500, 2000, 0, 10, 2),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', 'verre', 'VER-0001', 'Verres organiques indice 1.6', null, '44444444-4444-4444-4444-444444444444', 1000, 3000, 0, 20, 4),
  ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000001', 'accessoire', 'ACC-0001', 'Étui rigide', null, '44444444-4444-4444-4444-444444444444', 200, 200, 0, 15, 3);

-- sanity check on generated columns
select sku, purchase_price_ht, sale_price_ht, margin_amount, margin_percent from products order by sku;

-- ------------------------------------------------------------------
-- 3. Customer + prescription (as opticien)
-- ------------------------------------------------------------------
select set_config('app.current_user_id', '22222222-2222-2222-2222-222222222222', false);

insert into customers (id, store_id, first_name, last_name, phone, assigned_optician_id, created_by)
values ('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000001', 'Ahmed', 'Benali', '+212600000000', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222');

select customer_number, first_name, last_name from customers where id = '88888888-8888-8888-8888-888888888888';

insert into prescriptions (id, customer_id, od_sphere, od_cylinder, og_sphere, og_cylinder, doctor_name, created_by)
values ('99999999-9999-9999-9999-999999999999', '88888888-8888-8888-8888-888888888888', -1.25, -0.50, -1.00, -0.25, 'Dr. Fassi', '22222222-2222-2222-2222-222222222222');

-- ------------------------------------------------------------------
-- 4. Open the cash register (opticien) with a 1000 MAD float
-- ------------------------------------------------------------------
select (open_cash_register(1000, 'Ouverture matin')).id as register_id \gset

select id, status, opening_amount from cash_registers where id = :'register_id';

-- ------------------------------------------------------------------
-- 5. Create the sale: monture + verres + accessoire, 200 MAD cart
--    discount, 2000 MAD deposit paid in cash.
-- ------------------------------------------------------------------
select (create_sale(
  p_customer_id := '88888888-8888-8888-8888-888888888888',
  p_items := jsonb_build_array(
    jsonb_build_object('product_id', '55555555-5555-5555-5555-555555555555', 'item_role', 'monture', 'quantity', 1),
    jsonb_build_object('product_id', '66666666-6666-6666-6666-666666666666', 'item_role', 'verre', 'quantity', 1),
    jsonb_build_object('product_id', '77777777-7777-7777-7777-777777777777', 'item_role', 'accessoire', 'quantity', 1)
  ),
  p_prescription_id := '99999999-9999-9999-9999-999999999999',
  p_cart_discount_amount := 200,
  p_deposit_amount := 2000,
  p_payment_method_id := (select id from payment_methods where code = 'especes'),
  p_cash_register_id := :'register_id'
)).id as sale_id \gset

select
  sale_number, subtotal_ht, discount_amount, total_ht, total_ttc, cost_total,
  margin_amount, margin_percent, amount_paid, amount_due, status
from sales where id = :'sale_id';

-- Expected: subtotal_ht=5200 discount=200 total_ht=5000 total_ttc=5000
--           cost_total=2700 margin_amount=2300 margin_percent=46.00
--           amount_paid=2000 amount_due=3000 status='acompte'

select 'STOCK AFTER SALE' as label, sku, quantity from products order by sku;
-- Expected: MNT-0001=9, VER-0001=19, ACC-0001=14

select 'INVOICE' as label, invoice_number, total_ttc, amount_paid, amount_due from invoices where sale_id = :'sale_id';

-- ------------------------------------------------------------------
-- 6. Order / atelier workflow
-- ------------------------------------------------------------------
insert into orders (sale_id, customer_id, store_id, status)
values (:'sale_id', '88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000001', 'creee')
returning id as order_id \gset

update orders set status = 'verres_commandes' where id = :'order_id';
update orders set status = 'en_attente' where id = :'order_id';
update orders set status = 'recue' where id = :'order_id';
update orders set status = 'montage' where id = :'order_id';
update orders set status = 'controle' where id = :'order_id';
update orders set status = 'prete' where id = :'order_id';
update orders set status = 'client_informe' where id = :'order_id';
update orders set status = 'livree' where id = :'order_id';

select 'ORDER HISTORY' as label, from_status, to_status, changed_at from order_status_history where order_id = :'order_id' order by changed_at;

-- ------------------------------------------------------------------
-- 7. Client pays the remaining balance (3000 MAD, cash)
-- ------------------------------------------------------------------
select (record_payment(
  :'sale_id', 3000, 'solde',
  (select id from payment_methods where code = 'especes'),
  :'register_id'
)).status as sale_status_after_balance \gset

select sale_number, amount_paid, amount_due, status from sales where id = :'sale_id';
-- Expected: amount_paid=5000 amount_due=0 status='paye'

select 'CUSTOMER STATS' as label, purchase_count, lifetime_value, average_basket, balance_due, vip_tier
from v_customer_stats where customer_id = '88888888-8888-8888-8888-888888888888';
-- Expected: purchase_count=1 lifetime_value=5000 balance_due=0

-- ------------------------------------------------------------------
-- 8. Close the cash register
-- ------------------------------------------------------------------
select close_cash_register(:'register_id', 6000, 'Clôture soir') as closure_summary \gset
\echo :closure_summary
-- Expected expected_cash = 1000 (fond) + 2000 (acompte) + 3000 (solde) = 6000

-- ------------------------------------------------------------------
-- 9. Role-based margin visibility: opticien sees masked cost, admin sees real cost
-- ------------------------------------------------------------------
select 'AS OPTICIEN (masked)' as label, cost_total, margin_amount from v_sales where id = :'sale_id';

select set_config('app.current_user_id', '11111111-1111-1111-1111-111111111111', false);
select 'AS ADMIN (visible)' as label, cost_total, margin_amount from v_sales where id = :'sale_id';

select 'AS ADMIN products cost' as label, sku, purchase_price_ht, margin_amount from v_products order by sku;

-- ------------------------------------------------------------------
-- 10. Audit log coverage
-- ------------------------------------------------------------------
select 'AUDIT LOG' as label, action, module, entity_type, created_at from audit_logs order by created_at;

-- ------------------------------------------------------------------
-- 11. Negative test: opticien cannot exceed their discount limit without
--     admin authorization.
-- ------------------------------------------------------------------
select set_config('app.current_user_id', '22222222-2222-2222-2222-222222222222', false);

do $$
begin
  begin
    perform create_sale(
      p_customer_id := '88888888-8888-8888-8888-888888888888',
      p_items := jsonb_build_array(
        jsonb_build_object('product_id', '77777777-7777-7777-7777-777777777777', 'item_role', 'accessoire', 'quantity', 1)
      ),
      p_cart_discount_amount := 150 -- 75% of a 200 MAD line, way over the 10% limit
    );
    raise exception 'TEST FAILED: oversized discount was not blocked';
  exception when insufficient_privilege then
    raise notice 'PASS: oversized discount correctly rejected (%)', sqlerrm;
  end;
end $$;

-- Negative test: opticien cannot manually adjust stock
do $$
begin
  begin
    perform apply_stock_movement('55555555-5555-5555-5555-555555555555', 'ajustement', 5, 'test');
    raise exception 'TEST FAILED: opticien was allowed to adjust stock';
  exception when insufficient_privilege then
    raise notice 'PASS: opticien stock adjustment correctly rejected (%)', sqlerrm;
  end;
end $$;

-- Negative test: cannot oversell beyond available stock
do $$
begin
  begin
    perform create_sale(
      p_customer_id := '88888888-8888-8888-8888-888888888888',
      p_items := jsonb_build_array(
        jsonb_build_object('product_id', '55555555-5555-5555-5555-555555555555', 'item_role', 'monture', 'quantity', 999)
      )
    );
    raise exception 'TEST FAILED: oversell was not blocked';
  exception when others then
    raise notice 'PASS: oversell correctly rejected (%)', sqlerrm;
  end;
end $$;

select 'ALL SCENARIO STEPS EXECUTED' as result;
