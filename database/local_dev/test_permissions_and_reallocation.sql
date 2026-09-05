-- Tests for:
--   - suppliers insert/update now admin-only (opticien rejected)
--   - reallocate_invoice_item_prices(): redistributing an invoice's total
--     across its lines without ever changing that total
-- Run after test_scenario.sql on the same freshly-seeded database (reuses
-- its sale/invoice/customer/users).
\set ON_ERROR_STOP on
\pset pager off

-- These are RLS-policy checks, not an imperative is_admin() check inside a
-- function body — run as the actual `authenticated` role rather than the
-- postgres superuser, which transparently bypasses row-level security
-- (superusers and table owners are exempt from RLS by default), which
-- would make every one of these assertions pass regardless of the policy.
set role authenticated;

-- ------------------------------------------------------------------
-- 1. Suppliers: opticien is rejected, admin succeeds.
-- ------------------------------------------------------------------
select set_config('app.current_user_id', '22222222-2222-2222-2222-222222222222', false); -- opticien

do $do$
begin
  insert into suppliers (name) values ('Fournisseur test opticien');
  raise exception 'TEST FAILED: opticien was able to create a supplier';
exception when others then
  if sqlerrm like 'TEST FAILED%%' then raise; end if;
  raise notice 'PASS: opticien cannot create a supplier (%)', sqlerrm;
end $do$;

do $do$
begin
  update suppliers set name = 'Renamed by opticien' where id = '44444444-4444-4444-4444-444444444444';
  if found then
    raise exception 'TEST FAILED: opticien was able to update a supplier';
  end if;
exception when others then
  if sqlerrm like 'TEST FAILED%%' then raise; end if;
  raise notice 'PASS: opticien cannot update a supplier (%)', sqlerrm;
end $do$;

select set_config('app.current_user_id', '11111111-1111-1111-1111-111111111111', false); -- admin

insert into suppliers (name) values ('Fournisseur test admin');
do $do$
begin
  if not exists (select 1 from suppliers where name = 'Fournisseur test admin') then
    raise exception 'TEST FAILED: admin could not create a supplier';
  end if;
  raise notice 'PASS: admin can create a supplier';
end $do$;

-- ------------------------------------------------------------------
-- 2. reallocate_invoice_item_prices on the Ahmed Benali invoice
--    (monture 2000 + verres 3000 + accessoire 200, remise 200 -> 5000 TTC
--    at tax_rate 0, so line_total_ttc == line_total_ht for every line).
-- ------------------------------------------------------------------
select set_config('app.current_user_id', '22222222-2222-2222-2222-222222222222', false); -- opticien

-- test_scenario.sql runs as its own separate psql process, so its \gset
-- variables (sale_id included) don't carry over here — re-derive the
-- Ahmed Benali sale from the fixed customer id it hardcodes instead.
select s.id as sale_id from sales s where s.customer_id = '88888888-8888-8888-8888-888888888888' order by s.created_at limit 1 \gset
select id as invoice_id from invoices where sale_id = :'sale_id' \gset
select id as frame_item_id, line_total_ttc as frame_before from invoice_items where invoice_id = :'invoice_id' and description ilike '%monture%' \gset
select id as lens_item_id, line_total_ttc as lens_before from invoice_items where invoice_id = :'invoice_id' and description ilike '%verre%' \gset

select 'BEFORE REALLOCATION' as label, :frame_before as frame_ttc, :lens_before as lens_ttc, (:frame_before + :lens_before) as combined;

-- Move 500 from the frame to the lenses; combined total must stay identical.
select format($fmt$
select (reallocate_invoice_item_prices(%L::uuid, jsonb_build_array(
  jsonb_build_object('invoice_item_id', %L::uuid, 'new_price_ttc', %s),
  jsonb_build_object('invoice_item_id', %L::uuid, 'new_price_ttc', %s)
))).total_ttc as invoice_total_after_reallocation;
$fmt$, :'invoice_id', :'frame_item_id', :frame_before - 500, :'lens_item_id', :lens_before + 500) \gexec

select format($fmt$
do $do$
begin
  if (select line_total_ttc from invoice_items where id = %L::uuid) <> %s then
    raise exception 'TEST FAILED: frame line was not updated to the expected amount';
  end if;
  if (select line_total_ttc from invoice_items where id = %L::uuid) <> %s then
    raise exception 'TEST FAILED: lens line was not updated to the expected amount';
  end if;
  if (select total_ttc from invoices where id = %L::uuid) <> %s then
    raise exception 'TEST FAILED: invoice total changed after reallocation';
  end if;
  raise notice 'PASS: reallocating 500 MAD from frame to lenses kept the invoice total unchanged';
end $do$;
$fmt$, :'frame_item_id', :frame_before - 500, :'lens_item_id', :lens_before + 500, :'invoice_id', :frame_before + :lens_before) \gexec

-- Negative test: trying to sneak the total up must be rejected.
select format($fmt$
do $do$
begin
  perform reallocate_invoice_item_prices(%L::uuid, jsonb_build_array(
    jsonb_build_object('invoice_item_id', %L::uuid, 'new_price_ttc', %s)
  ));
  raise exception 'TEST FAILED: inflating the invoice total via reallocation was not rejected';
exception when others then
  if sqlerrm like 'TEST FAILED%%' then raise; end if;
  raise notice 'PASS: reallocation that would change the invoice total correctly rejected (%%)', sqlerrm;
end $do$;
$fmt$, :'invoice_id', :'frame_item_id', :frame_before - 500 + 1) \gexec

-- Negative test: a line item from a different invoice must be rejected.
-- Create a small second sale/invoice for the same customer so this test is
-- self-contained regardless of what other test files have run before it.
select (create_sale(
  p_customer_id := '88888888-8888-8888-8888-888888888888',
  p_items := jsonb_build_array(
    jsonb_build_object('product_id', '77777777-7777-7777-7777-777777777777', 'item_role', 'accessoire', 'quantity', 1)
  )
)).id as other_sale_id \gset
select id as other_invoice_id from invoices where sale_id = :'other_sale_id' \gset
select id as foreign_item_id from invoice_items where invoice_id = :'other_invoice_id' limit 1 \gset

select format($fmt$
do $do$
begin
  perform reallocate_invoice_item_prices(%L::uuid, jsonb_build_array(
    jsonb_build_object('invoice_item_id', %L::uuid, 'new_price_ttc', 1)
  ));
  raise exception 'TEST FAILED: a line item from a different invoice was not rejected';
exception when others then
  if sqlerrm like 'TEST FAILED%%' then raise; end if;
  raise notice 'PASS: a line item from a different invoice correctly rejected (%%)', sqlerrm;
end $do$;
$fmt$, :'invoice_id', :'foreign_item_id') \gexec

reset role;

select 'PERMISSIONS AND REALLOCATION TESTS COMPLETE' as result;
