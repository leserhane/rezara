-- Inventory workflow: start_inventory() snapshot, counting, validate
-- (admin-only, applies differences to stock via apply_stock_movement),
-- cancel, and the RLS lock on direct writes / post-close edits.
\set ON_ERROR_STOP on
\pset pager off

set role authenticated;
select set_config('app.current_user_id', '22222222-2222-2222-2222-222222222222', false); -- opticien

-- ------------------------------------------------------------------
-- 1. Opticien can start an inventory; it snapshots every active product.
-- ------------------------------------------------------------------
select (start_inventory('Comptage mensuel')).id as inv_id \gset

select case when (select count(*) from inventory_items where inventory_id = :'inv_id')
              = (select count(*) from products where is_active)
       then 'PASS: inventory snapshot covers every active product'
       else 'FAIL: snapshot item count mismatch' end;

select case when not exists (
  select 1 from inventory_items ii join products p on p.id = ii.product_id
  where ii.inventory_id = :'inv_id' and ii.theoretical_quantity <> p.quantity
) then 'PASS: theoretical_quantity matches current stock at snapshot time'
  else 'FAIL: theoretical_quantity mismatch' end;

do $$
begin
  perform start_inventory('should be rejected, one is already en_cours');
  raise exception 'FAIL: starting a second inventory while one is open should be rejected';
exception when others then
  if sqlerrm like '%FAIL:%' then raise; end if;
  raise notice 'PASS: concurrent inventory correctly rejected (%)', sqlerrm;
end $$;

-- ------------------------------------------------------------------
-- 2. Direct inserts into inventories/inventory_items are blocked now —
--    only start_inventory() may create rows.
-- ------------------------------------------------------------------
do $$
begin
  insert into inventories (store_id, reference, started_by)
  values ('00000000-0000-0000-0000-000000000001', 'HAND-MADE', auth.uid());
  raise exception 'FAIL: direct insert into inventories should have been rejected';
exception when others then
  if sqlerrm like '%FAIL:%' then raise; end if;
  raise notice 'PASS: direct insert into inventories correctly rejected (%)', sqlerrm;
end $$;

-- ------------------------------------------------------------------
-- 3. Opticien records counts — one exact, one over, one under.
-- ------------------------------------------------------------------
select format(
  $u$update inventory_items set counted_quantity = theoretical_quantity, counted_by = %L, counted_at = now()
     where inventory_id = %L and product_id = '55555555-5555-5555-5555-555555555555'$u$,
  '22222222-2222-2222-2222-222222222222', :'inv_id'
) \gexec

select format(
  $u$update inventory_items set counted_quantity = theoretical_quantity + 2, counted_by = %L, counted_at = now()
     where inventory_id = %L and product_id = '66666666-6666-6666-6666-666666666666'$u$,
  '22222222-2222-2222-2222-222222222222', :'inv_id'
) \gexec

select format(
  $u$update inventory_items set counted_quantity = theoretical_quantity - 3, counted_by = %L, counted_at = now()
     where inventory_id = %L and product_id = '77777777-7777-7777-7777-777777777777'$u$,
  '22222222-2222-2222-2222-222222222222', :'inv_id'
) \gexec

select case when (select count(*) from inventory_items where inventory_id = :'inv_id' and counted_quantity is not null) = 3
       then 'PASS: all three counts recorded'
       else 'FAIL: counts not recorded' end;

-- ------------------------------------------------------------------
-- 4. Opticien cannot validate — admin-only.
-- ------------------------------------------------------------------
select format($fmt$
do $do$
begin
  perform validate_inventory(%L::uuid);
  raise exception 'FAIL: opticien should not be able to validate an inventory';
exception when others then
  if sqlerrm like '%%FAIL:%%' then raise; end if;
  raise notice 'PASS: opticien validate correctly rejected (%%)', sqlerrm;
end $do$;
$fmt$, :'inv_id') \gexec

-- ------------------------------------------------------------------
-- 5. Admin validates: stock should move by exactly the counted
--    differences (+2 on verres, -3 on étuis, unchanged on the exact one).
-- ------------------------------------------------------------------
select set_config('app.current_user_id', '11111111-1111-1111-1111-111111111111', false); -- admin

select quantity as qty_before_verres from products where id = '66666666-6666-6666-6666-666666666666' \gset
select quantity as qty_before_etuis from products where id = '77777777-7777-7777-7777-777777777777' \gset

select validate_inventory(:'inv_id');

select case when (select quantity from products where id = '66666666-6666-6666-6666-666666666666') = :qty_before_verres + 2
       then 'PASS: verres stock increased by the counted surplus (+2)'
       else 'FAIL: verres stock not adjusted correctly' end;

select case when (select quantity from products where id = '77777777-7777-7777-7777-777777777777') = :qty_before_etuis - 3
       then 'PASS: étuis stock decreased by the counted shortage (-3)'
       else 'FAIL: étuis stock not adjusted correctly' end;

select case when (select status from inventories where id = :'inv_id') = 'valide'
       then 'PASS: inventory marked valide'
       else 'FAIL: inventory status not updated' end;

-- ------------------------------------------------------------------
-- 6. A validated inventory cannot be edited or re-validated.
-- ------------------------------------------------------------------
select set_config('app.current_user_id', '22222222-2222-2222-2222-222222222222', false); -- opticien

select format(
  $u$update inventory_items set counted_quantity = 999 where inventory_id = %L and product_id = '55555555-5555-5555-5555-555555555555'$u$,
  :'inv_id'
) \gexec

select case when (select counted_quantity from inventory_items where inventory_id = :'inv_id' and product_id = '55555555-5555-5555-5555-555555555555') <> 999
       then 'PASS: count on a validated inventory silently rejected by RLS'
       else 'FAIL: count was editable after validation' end;

select set_config('app.current_user_id', '11111111-1111-1111-1111-111111111111', false); -- admin

select format($fmt$
do $do$
begin
  perform validate_inventory(%L::uuid);
  raise exception 'FAIL: re-validating an already-validated inventory should fail';
exception when others then
  if sqlerrm like '%%FAIL:%%' then raise; end if;
  raise notice 'PASS: re-validation correctly rejected (%%)', sqlerrm;
end $do$;
$fmt$, :'inv_id') \gexec

-- ------------------------------------------------------------------
-- 7. cancel_inventory: a second count sheet, abandoned, must not touch
--    stock at all.
-- ------------------------------------------------------------------
select set_config('app.current_user_id', '22222222-2222-2222-2222-222222222222', false); -- opticien
select (start_inventory('Test annulation')).id as inv2_id \gset

select format(
  $u$update inventory_items set counted_quantity = theoretical_quantity + 50, counted_by = %L, counted_at = now()
     where inventory_id = %L and product_id = '55555555-5555-5555-5555-555555555555'$u$,
  '22222222-2222-2222-2222-222222222222', :'inv2_id'
) \gexec

select quantity as qty_before_cancel from products where id = '55555555-5555-5555-5555-555555555555' \gset

select set_config('app.current_user_id', '11111111-1111-1111-1111-111111111111', false); -- admin
select cancel_inventory(:'inv2_id');

select case when (select quantity from products where id = '55555555-5555-5555-5555-555555555555') = :qty_before_cancel
       then 'PASS: cancelling an inventory left stock untouched'
       else 'FAIL: cancel affected stock' end;

select case when (select status from inventories where id = :'inv2_id') = 'annule'
       then 'PASS: inventory marked annule'
       else 'FAIL: cancel did not update status' end;

reset role;
