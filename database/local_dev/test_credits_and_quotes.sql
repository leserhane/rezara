-- Tests for create_credit() / record_payment(..., credit_installment_id)
-- and convert_quote_to_sale(). Run after test_scenario.sql on the same
-- freshly-seeded database (reuses its products/customer/users).
\set ON_ERROR_STOP on
\pset pager off

select set_config('app.current_user_id', '22222222-2222-2222-2222-222222222222', false); -- opticien

-- ------------------------------------------------------------------
-- 1. Credit: sell an accessory (200 MAD) with no deposit, then split
--    the balance into 2 installments of 100 MAD each.
-- ------------------------------------------------------------------
select (create_sale(
  p_customer_id := '88888888-8888-8888-8888-888888888888',
  p_items := jsonb_build_array(
    jsonb_build_object('product_id', '77777777-7777-7777-7777-777777777777', 'item_role', 'accessoire', 'quantity', 1)
  )
)).id as credit_sale_id \gset

select sale_number, total_ttc, amount_due, status from sales where id = :'credit_sale_id';
-- Expected: total_ttc=200 amount_due=200 status=non_paye

select (create_credit(
  :'credit_sale_id', current_date + 60, 'mensuel',
  jsonb_build_array(
    jsonb_build_object('due_date', (current_date + 30)::text, 'amount', 100),
    jsonb_build_object('due_date', (current_date + 60)::text, 'amount', 100)
  )
)).id as credit_id \gset

select status from sales where id = :'credit_sale_id';
-- Expected: credit

select 'INSTALLMENTS' as label, due_date, amount, status from credit_installments where credit_id = :'credit_id' order by due_date;

select id as first_installment_id from credit_installments where credit_id = :'credit_id' order by due_date limit 1 \gset

select (record_payment(
  :'credit_sale_id', 100, 'echeance_credit',
  (select id from payment_methods where code = 'especes'),
  null, null, null, :'first_installment_id'
)).status as status_after_first_installment \gset

select 'AFTER FIRST INSTALLMENT' as label, s.status as sale_status, s.amount_due, c.paid_amount as credit_paid, c.balance as credit_balance
from sales s join credits c on c.sale_id = s.id where s.id = :'credit_sale_id';
select 'INSTALLMENT STATUS' as label, id, amount, paid_amount, status from credit_installments where credit_id = :'credit_id' order by due_date;
-- Expected: sale_status=credit amount_due=100 credit_paid=100 credit_balance=100
-- Expected: first installment status=payee, second en_attente

select id as second_installment_id from credit_installments where credit_id = :'credit_id' and status = 'en_attente' order by due_date limit 1 \gset

select (record_payment(
  :'credit_sale_id', 100, 'echeance_credit',
  (select id from payment_methods where code = 'especes'),
  null, null, null, :'second_installment_id'
)).status as status_after_second_installment \gset

select 'AFTER FINAL INSTALLMENT' as label, s.status as sale_status, s.amount_due, c.paid_amount as credit_paid, c.status as credit_status
from sales s join credits c on c.sale_id = s.id where s.id = :'credit_sale_id';
-- Expected: sale_status=paye amount_due=0 credit_paid=200 credit_status=solde

-- Negative test: installments must sum to amount_due.
select (create_sale(
  p_customer_id := '88888888-8888-8888-8888-888888888888',
  p_items := jsonb_build_array(jsonb_build_object('product_id', '77777777-7777-7777-7777-777777777777', 'item_role', 'accessoire', 'quantity', 1))
)).id as mismatch_sale_id \gset

select format($fmt$
do $do$
begin
  perform create_credit(%L::uuid, current_date, 'mensuel', jsonb_build_array(jsonb_build_object('due_date', current_date::text, 'amount', 50)));
  raise exception 'TEST FAILED: mismatched installment total was not rejected';
exception when others then
  if sqlerrm like 'TEST FAILED%%' then raise; end if;
  raise notice 'PASS: mismatched installment total correctly rejected (%%)', sqlerrm;
end $do$;
$fmt$, :'mismatch_sale_id') \gexec

-- Negative test: cannot overpay a single installment (installment 2 was
-- already fully paid above, so requesting any amount against it now
-- exceeds its remaining due of 0).
select format($fmt$
do $do$
begin
  perform record_payment(%L::uuid, 0.01, 'echeance_credit', (select id from payment_methods where code = 'especes'), null, null, null, %L::uuid);
  raise exception 'TEST FAILED: overpaying a settled installment was not rejected';
exception when others then
  if sqlerrm like 'TEST FAILED%%' then raise; end if;
  raise notice 'PASS: overpaying a settled installment correctly rejected (%%)', sqlerrm;
end $do$;
$fmt$, :'credit_sale_id', :'second_installment_id') \gexec

-- ------------------------------------------------------------------
-- 2. Quote -> Sale conversion
-- ------------------------------------------------------------------
insert into quotes (store_id, customer_id, optician_id, status, discount_amount, notes)
values ('00000000-0000-0000-0000-000000000001', '88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'accepte', 50, 'Devis test')
returning id as quote_id \gset

insert into quote_items (quote_id, product_id, item_role, quantity, unit_price_ht, tax_rate)
values (:'quote_id', '66666666-6666-6666-6666-666666666666', 'verre', 1, 3000, 0);

select quote_number, status, total_ttc from quotes where id = :'quote_id';

select (convert_quote_to_sale(:'quote_id')).id as converted_sale_id \gset

select status, converted_sale_id from quotes where id = :'quote_id';
select sale_number, subtotal_ht, discount_amount, total_ttc, status from sales where id = :'converted_sale_id';
-- Expected: quote status=transforme, converted_sale_id set
-- Expected: sale subtotal_ht=3000 discount_amount=50 total_ttc=2950 status=non_paye

-- Negative test: cannot convert an already-converted quote.
select format($fmt$
do $do$
begin
  perform convert_quote_to_sale(%L::uuid);
  raise exception 'TEST FAILED: double conversion was not blocked';
exception when others then
  if sqlerrm like 'TEST FAILED%%' then raise; end if;
  raise notice 'PASS: double quote conversion correctly rejected (%%)', sqlerrm;
end $do$;
$fmt$, :'quote_id') \gexec

select 'CREDITS AND QUOTES TESTS COMPLETE' as result;
