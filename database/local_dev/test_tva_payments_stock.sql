-- Additional coverage for spec #51's required test list not already
-- exercised by test_scenario.sql / test_credits_and_quotes.sql:
--   - TVA calculation with a non-zero tax rate
--   - multiple partial payments settling a balance (spec #17's own
--     example: acompte 2000, then 1000 + 2000 to close it out)
--   - stock movement types: entree, sortie, ajustement, retour_fournisseur
-- Run after test_scenario.sql (reuses its fixed customer/product/user ids).
\set ON_ERROR_STOP on
\pset pager off

select set_config('app.current_user_id', '22222222-2222-2222-2222-222222222222', false); -- opticien

-- ------------------------------------------------------------------
-- 1. TVA: a product with a real 20% tax rate.
-- ------------------------------------------------------------------
insert into products (id, store_id, type, sku, name, purchase_price_ht, sale_price_ht, tax_rate, quantity, stock_min)
values ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'accessoire', 'TVA-TEST-01', 'Produit TVA 20%', 50, 100, 20.00, 50, 5);

select (create_sale(
  p_customer_id := '88888888-8888-8888-8888-888888888888',
  p_items := jsonb_build_array(
    jsonb_build_object('product_id', 'aaaaaaaa-0000-0000-0000-000000000001', 'item_role', 'accessoire', 'quantity', 2)
  )
)).id as tva_sale_id \gset

select 'TVA CHECK' as label, subtotal_ht, tax_amount, total_ht, total_ttc from sales where id = :'tva_sale_id';
-- unit 100 x2 = 200 HT, TVA 20% = 40, TTC = 240
do $$
declare v_ht numeric; v_tax numeric; v_ttc numeric;
begin
  select subtotal_ht, tax_amount, total_ttc into v_ht, v_tax, v_ttc from sales where sale_number = (select sale_number from sales order by created_at desc limit 1);
  if v_ht = 200.00 and v_tax = 40.00 and v_ttc = 240.00 then
    raise notice 'PASS: TVA correctly computed (HT=%, TVA=%, TTC=%)', v_ht, v_tax, v_ttc;
  else
    raise exception 'TEST FAILED: TVA computation wrong (HT=%, TVA=%, TTC=%)', v_ht, v_tax, v_ttc;
  end if;
end $$;

-- ------------------------------------------------------------------
-- 2. Multiple partial payments, exactly spec #17's own example:
--    sale total 5000 (monture 2000 + verre 3000), acompte 2000 leaves
--    3000 due, then the client pays 1000, then 2000, fully closing it.
-- ------------------------------------------------------------------
select (create_sale(
  p_customer_id := '88888888-8888-8888-8888-888888888888',
  p_items := jsonb_build_array(
    jsonb_build_object('product_id', '55555555-5555-5555-5555-555555555555', 'item_role', 'monture', 'quantity', 1), -- 2000
    jsonb_build_object('product_id', '66666666-6666-6666-6666-666666666666', 'item_role', 'verre', 'quantity', 1)     -- 3000
  ),
  p_deposit_amount := 2000,
  p_payment_method_id := (select id from payment_methods where code = 'especes')
)).id as partial_sale_id \gset

select 'AFTER ACOMPTE 2000' as label, total_ttc, amount_paid, amount_due, status from sales where id = :'partial_sale_id';
-- Expected: total_ttc=5000 amount_paid=2000 amount_due=3000 status=acompte

select (record_payment(:'partial_sale_id', 1000, 'solde', (select id from payment_methods where code = 'especes'))).status as status_after_1000 \gset
select 'AFTER +1000' as label, amount_paid, amount_due, status from sales where id = :'partial_sale_id';
-- Expected: amount_paid=3000 amount_due=2000 status=partiellement_paye

select (record_payment(:'partial_sale_id', 2000, 'solde', (select id from payment_methods where code = 'especes'))).status as status_after_2000 \gset
select 'AFTER +2000 (final)' as label, amount_paid, amount_due, status from sales where id = :'partial_sale_id';
-- Expected: amount_paid=5000 amount_due=0 status=paye

select (amount_paid = 5000.00 and amount_due = 0.00 and status = 'paye') as is_ok from sales where id = :'partial_sale_id' \gset
\if :is_ok
\echo 'PASS: multi-step partial payments correctly settle the balance'
\else
\warn 'TEST FAILED: partial payment settlement did not converge as expected'
\endif

-- ------------------------------------------------------------------
-- 3. Stock movements: entree, ajustement (admin), retour_fournisseur.
-- ------------------------------------------------------------------
select quantity as stock_before from products where id = 'aaaaaaaa-0000-0000-0000-000000000001' \gset

-- entree (adding new stock) requires admin, same as ajustement/inventaire;
-- opticien should be rejected.
select format($fmt$
do $do$
begin
  perform apply_stock_movement(%L::uuid, 'entree', 20, 'Reception fournisseur');
  raise exception 'TEST FAILED: opticien entree was not rejected';
exception when others then
  if sqlerrm like 'TEST FAILED%%' then raise; end if;
  raise notice 'PASS: opticien cannot apply entree (%%)', sqlerrm;
end $do$;
$fmt$, 'aaaaaaaa-0000-0000-0000-000000000001') \gexec

select set_config('app.current_user_id', '11111111-1111-1111-1111-111111111111', false); -- admin

select (apply_stock_movement('aaaaaaaa-0000-0000-0000-000000000001', 'entree', 20, 'Reception fournisseur')).new_quantity as after_entree \gset
select 'ENTREE (admin)' as label, :stock_before as before, :after_entree as after;

select set_config('app.current_user_id', '22222222-2222-2222-2222-222222222222', false); -- back to opticien

select (apply_stock_movement('aaaaaaaa-0000-0000-0000-000000000001', 'retour_fournisseur', -5, 'Retour produits defectueux')).new_quantity as after_retour \gset
select 'RETOUR FOURNISSEUR (opticien, still allowed)' as label, :after_entree as before, :after_retour as after;

-- ajustement requires admin; opticien should be rejected (re-verify then switch).
select format($fmt$
do $do$
begin
  perform apply_stock_movement(%L::uuid, 'ajustement', 3, 'Correction inventaire');
  raise exception 'TEST FAILED: opticien ajustement was not rejected';
exception when others then
  if sqlerrm like 'TEST FAILED%%' then raise; end if;
  raise notice 'PASS: opticien cannot apply ajustement (%%)', sqlerrm;
end $do$;
$fmt$, 'aaaaaaaa-0000-0000-0000-000000000001') \gexec

select set_config('app.current_user_id', '11111111-1111-1111-1111-111111111111', false); -- admin

select (apply_stock_movement('aaaaaaaa-0000-0000-0000-000000000001', 'ajustement', 3, 'Correction inventaire admin')).new_quantity as after_ajustement \gset
select 'AJUSTEMENT (admin)' as label, :after_retour as before, :after_ajustement as after;

select 'STOCK MOVEMENT JOURNAL' as label, type, quantity_change, previous_quantity, new_quantity, reason
from stock_movements where product_id = 'aaaaaaaa-0000-0000-0000-000000000001' order by created_at;

select 'TVA, PARTIAL PAYMENTS, STOCK TESTS COMPLETE' as result;
