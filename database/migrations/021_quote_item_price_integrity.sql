-- quote_items are inserted directly by the client (there's no create_sale-
-- style RPC for quotes, since a quote is just a non-binding draft built
-- incrementally). That means, unlike sale_items, nothing stops a client
-- from sending an arbitrary unit_price_ht for a catalog product. Close
-- that gap the same way create_sale() does: when a quote_item references
-- a real product, its price/tax are always pulled server-side from the
-- product record, never trusted from the client. Only fully custom lines
-- (product_id null) keep a client-supplied price.

create or replace function enforce_quote_item_pricing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
begin
  if new.product_id is not null then
    select * into v_product from products where id = new.product_id;
    if not found then
      raise exception 'product_not_found: %', new.product_id;
    end if;
    new.unit_price_ht := v_product.sale_price_ht;
    new.tax_rate := v_product.tax_rate;
    if new.description is null then
      new.description := v_product.name;
    end if;
  elsif new.unit_price_ht is null then
    raise exception 'unit_price_ht_required_for_custom_quote_line';
  end if;
  return new;
end;
$$;

create trigger trg_quote_items_pricing
  before insert or update on quote_items
  for each row execute function enforce_quote_item_pricing();
