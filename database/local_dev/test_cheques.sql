-- Tests for record_cheque_payment() / cash_cheque() / reject_cheque().
-- Run after test_scenario.sql on the same freshly-seeded database (reuses
-- its accessoire product, customer and opticien user).
\set ON_ERROR_STOP on
\pset pager off

select set_config('app.current_user_id', '22222222-2222-2222-2222-222222222222', false); -- opticien

-- ------------------------------------------------------------------
-- 1. Sell an accessory (200 MAD, no deposit), settle it with 3 cheques
--    that sum exactly to the amount due.
-- ------------------------------------------------------------------
select (create_sale(
  p_customer_id := '88888888-8888-8888-8888-888888888888',
  p_items := jsonb_build_array(
    jsonb_build_object('product_id', '77777777-7777-7777-7777-777777777777', 'item_role', 'accessoire', 'quantity', 1)
  )
)).id as cheque_sale_id \gset

select sale_number, total_ttc, amount_due, status from sales where id = :'cheque_sale_id';
-- Expected: total_ttc=200 amount_due=200 status=non_paye

select (record_cheque_payment(
  :'cheque_sale_id',
  jsonb_build_array(
    jsonb_build_object('amount', 70, 'due_date', (current_date + 30)::text, 'cheque_number', 'CHQ-001', 'bank_name', 'Attijariwafa Bank'),
    jsonb_build_object('amount', 70, 'due_date', (current_date + 60)::text, 'cheque_number', 'CHQ-002', 'bank_name', 'Attijariwafa Bank'),
    jsonb_build_object('amount', 60, 'due_date', (current_date + 90)::text, 'cheque_number', 'CHQ-003', 'bank_name', 'Attijariwafa Bank')
  )
)).status as sale_status_after_cheques \gset

select sale_number, amount_paid, amount_due, status from sales where id = :'cheque_sale_id';
-- Expected: amount_paid=200 amount_due=0 status=paye

select count(*) as cheque_count, sum(amount) as cheque_total from cheques where sale_id = :'cheque_sale_id';
-- Expected: cheque_count=3 cheque_total=200

select format($fmt$
do $do$
begin
  if (select count(*) from cheques where sale_id = %L::uuid and status = 'en_attente') <> 3 then
    raise exception 'TEST FAILED: expected 3 pending cheques';
  end if;
  raise notice 'PASS: 3 cheques recorded, all pending';
end $do$;
$fmt$, :'cheque_sale_id') \gexec

-- ------------------------------------------------------------------
-- 2. Cash the first cheque, reject the second, leave the third pending.
-- ------------------------------------------------------------------
select id as first_cheque_id from cheques where sale_id = :'cheque_sale_id' and cheque_number = 'CHQ-001' \gset
select id as second_cheque_id from cheques where sale_id = :'cheque_sale_id' and cheque_number = 'CHQ-002' \gset

select (cash_cheque(:'first_cheque_id')).status as first_cheque_status;
-- Expected: encaisse

select (reject_cheque(:'second_cheque_id', 'Provision insuffisante')).status as second_cheque_status;
-- Expected: rejete

select sale_number, amount_paid, amount_due, status from sales where id = :'cheque_sale_id';
-- Expected: amount_paid=130 amount_due=70 status=partiellement_paye (200 - 70 rejected)

select format($fmt$
do $do$
begin
  if (select amount_paid from sales where id = %L::uuid) <> 130 then
    raise exception 'TEST FAILED: amount_paid was not reversed correctly after a bounced cheque';
  end if;
  raise notice 'PASS: rejecting a cheque correctly reversed its amount from amount_paid';
end $do$;
$fmt$, :'cheque_sale_id') \gexec

-- ------------------------------------------------------------------
-- 3. Negative tests
-- ------------------------------------------------------------------

-- More than 5 cheques on one sale must be rejected.
select (create_sale(
  p_customer_id := '88888888-8888-8888-8888-888888888888',
  p_items := jsonb_build_array(
    jsonb_build_object('product_id', '77777777-7777-7777-7777-777777777777', 'item_role', 'accessoire', 'quantity', 1)
  )
)).id as too_many_sale_id \gset

select format($fmt$
do $do$
begin
  perform record_cheque_payment(%L::uuid, jsonb_build_array(
    jsonb_build_object('amount', 33, 'due_date', (current_date+10)::text),
    jsonb_build_object('amount', 33, 'due_date', (current_date+20)::text),
    jsonb_build_object('amount', 33, 'due_date', (current_date+30)::text),
    jsonb_build_object('amount', 33, 'due_date', (current_date+40)::text),
    jsonb_build_object('amount', 34, 'due_date', (current_date+50)::text),
    jsonb_build_object('amount', 34, 'due_date', (current_date+60)::text)
  ));
  raise exception 'TEST FAILED: 6 cheques on one sale were not rejected';
exception when others then
  if sqlerrm like 'TEST FAILED%%' then raise; end if;
  raise notice 'PASS: more than 5 cheques correctly rejected (%%)', sqlerrm;
end $do$;
$fmt$, :'too_many_sale_id') \gexec

-- Cheques summing above the amount due must be rejected.
select format($fmt$
do $do$
begin
  perform record_cheque_payment(%L::uuid, jsonb_build_array(
    jsonb_build_object('amount', 500, 'due_date', (current_date+10)::text)
  ));
  raise exception 'TEST FAILED: cheque total exceeding amount due was not rejected';
exception when others then
  if sqlerrm like 'TEST FAILED%%' then raise; end if;
  raise notice 'PASS: cheque total exceeding amount due correctly rejected (%%)', sqlerrm;
end $do$;
$fmt$, :'too_many_sale_id') \gexec

-- A cheque that's already been cashed can't be cashed or rejected again.
select format($fmt$
do $do$
begin
  perform cash_cheque(%L::uuid);
  raise exception 'TEST FAILED: re-cashing an already-cashed cheque was not rejected';
exception when others then
  if sqlerrm like 'TEST FAILED%%' then raise; end if;
  raise notice 'PASS: re-cashing an already-cashed cheque correctly rejected (%%)', sqlerrm;
end $do$;
$fmt$, :'first_cheque_id') \gexec

select format($fmt$
do $do$
begin
  perform reject_cheque(%L::uuid, 'test');
  raise exception 'TEST FAILED: rejecting an already-rejected cheque was not rejected';
exception when others then
  if sqlerrm like 'TEST FAILED%%' then raise; end if;
  raise notice 'PASS: rejecting an already-rejected cheque correctly rejected (%%)', sqlerrm;
end $do$;
$fmt$, :'second_cheque_id') \gexec

do $do$ begin raise notice 'All cheque tests completed.'; end $do$;
