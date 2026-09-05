-- The inventories/inventory_items tables existed since Phase 1 (RLS +
-- schema only) but no workflow was ever built on top of them: nothing
-- populated a count sheet, nothing applied the counted results back onto
-- stock. This adds that workflow as three RPCs, and locks down direct
-- writes the same way every other multi-step, stock-affecting operation
-- in this schema is locked down (sales, payments, stock_movements, ...).

-- ---------------------------------------------------------------------
-- Direct inserts into inventories/inventory_items now only happen through
-- start_inventory() below, which needs to snapshot every active product's
-- current quantity atomically — a client-side insert loop could race with
-- concurrent stock movements and record an inconsistent snapshot.
-- ---------------------------------------------------------------------
drop policy if exists inventories_write on inventories;
create policy inventories_write on inventories for insert with check (false);

drop policy if exists inventory_items_write on inventory_items;
create policy inventory_items_write on inventory_items for insert with check (false);

-- Recording a count is still a direct table update (any authenticated
-- staff member, same trust level as editing a quote line) — but only
-- while the parent inventory is still open, so a validated or cancelled
-- count sheet can no longer be edited after the fact.
drop policy if exists inventory_items_update on inventory_items;
create policy inventory_items_update on inventory_items for update
  using (exists (select 1 from inventories i where i.id = inventory_items.inventory_id and i.status = 'en_cours'))
  with check (exists (select 1 from inventories i where i.id = inventory_items.inventory_id and i.status = 'en_cours'));

--------------------------------------------------------------------------
-- start_inventory: open a new count sheet, snapshotting every active
-- product's current quantity as the "theoretical" figure staff will count
-- against. Any authenticated user can start one — it's a routine task,
-- not a stock-affecting one by itself.
--------------------------------------------------------------------------
create or replace function start_inventory(p_notes text default null)
returns inventories
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_inventory inventories%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select store_id into v_store_id from profiles where id = auth.uid();
  if v_store_id is null then
    raise exception 'profile_not_found';
  end if;

  if exists (select 1 from inventories where store_id = v_store_id and status = 'en_cours') then
    raise exception 'inventory_already_in_progress: close or cancel it before starting a new one';
  end if;

  insert into inventories (store_id, reference, started_by, notes)
  values (v_store_id, next_document_number(v_store_id, 'inventaire', true), auth.uid(), p_notes)
  returning * into v_inventory;

  insert into inventory_items (inventory_id, product_id, theoretical_quantity)
  select v_inventory.id, p.id, p.quantity
  from products p
  where p.store_id = v_store_id and p.is_active;

  perform write_audit_log('inventory.start', 'inventories', 'inventory', v_inventory.id, null, to_jsonb(v_inventory));

  return v_inventory;
end;
$$;

--------------------------------------------------------------------------
-- validate_inventory: apply every counted line's difference onto actual
-- stock (via apply_stock_movement, so it goes through the exact same
-- stock_movements audit trail as any other adjustment) and close the
-- count sheet. Admin-only, matching that only admins can otherwise adjust
-- stock by hand (027). Lines never counted are left untouched — a partial
-- count still lets you reconcile what you did get to.
--------------------------------------------------------------------------
create or replace function validate_inventory(p_inventory_id uuid)
returns inventories
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inventory inventories%rowtype;
  v_item inventory_items%rowtype;
begin
  if not is_admin() then
    raise exception 'insufficient_privilege: only admin can validate an inventory' using errcode = '42501';
  end if;

  select * into v_inventory from inventories where id = p_inventory_id for update;
  if not found then
    raise exception 'inventory_not_found: %', p_inventory_id;
  end if;
  if v_inventory.status <> 'en_cours' then
    raise exception 'inventory_already_%', v_inventory.status;
  end if;

  for v_item in
    select * from inventory_items
    where inventory_id = p_inventory_id and counted_quantity is not null and difference <> 0
  loop
    perform apply_stock_movement(
      v_item.product_id, 'inventaire', v_item.difference,
      format('Inventaire %s', v_inventory.reference), 'inventory', p_inventory_id
    );
  end loop;

  update inventories set status = 'valide', validated_by = auth.uid(), validated_at = now()
  where id = p_inventory_id
  returning * into v_inventory;

  perform write_audit_log('inventory.validate', 'inventories', 'inventory', p_inventory_id, null, to_jsonb(v_inventory));

  return v_inventory;
end;
$$;

--------------------------------------------------------------------------
-- cancel_inventory: abandon a count sheet without touching stock.
--------------------------------------------------------------------------
create or replace function cancel_inventory(p_inventory_id uuid)
returns inventories
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inventory inventories%rowtype;
begin
  if not is_admin() then
    raise exception 'insufficient_privilege: only admin can cancel an inventory' using errcode = '42501';
  end if;

  select * into v_inventory from inventories where id = p_inventory_id for update;
  if not found then
    raise exception 'inventory_not_found: %', p_inventory_id;
  end if;
  if v_inventory.status <> 'en_cours' then
    raise exception 'inventory_already_%', v_inventory.status;
  end if;

  update inventories set status = 'annule' where id = p_inventory_id returning * into v_inventory;
  perform write_audit_log('inventory.cancel', 'inventories', 'inventory', p_inventory_id, null, to_jsonb(v_inventory));
  return v_inventory;
end;
$$;

grant execute on function start_inventory(text) to authenticated;
grant execute on function validate_inventory(uuid) to authenticated;
grant execute on function cancel_inventory(uuid) to authenticated;
