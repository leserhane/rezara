-- Quotes need the same "never trust the frontend for totals" guarantee as
-- sales (spec #57), but unlike create_sale() a quote is built line-by-line
-- via plain INSERTs into quote_items (RLS already allows this for any
-- authenticated user), so there's no single RPC call to hang the
-- computation off. Instead, recompute the quote's totals with a trigger
-- every time its items change.

create or replace function recompute_quote_totals(p_quote_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quote quotes%rowtype;
  v_subtotal_ht numeric := 0;
  v_items_tax numeric := 0;
  v_discount_ratio numeric := 1;
  v_total_ht numeric;
  v_tax_amount numeric;
begin
  select * into v_quote from quotes where id = p_quote_id for update;
  if not found then
    return;
  end if;

  select
    coalesce(sum(round(qi.unit_price_ht * qi.quantity - qi.discount_amount, 2)), 0),
    coalesce(sum(round((qi.unit_price_ht * qi.quantity - qi.discount_amount) * qi.tax_rate / 100, 2)), 0)
  into v_subtotal_ht, v_items_tax
  from quote_items qi where qi.quote_id = p_quote_id;

  if v_subtotal_ht > 0 then
    v_discount_ratio := greatest(v_subtotal_ht - v_quote.discount_amount, 0) / v_subtotal_ht;
  end if;
  v_total_ht := round(v_subtotal_ht - v_quote.discount_amount, 2);
  v_tax_amount := round(v_items_tax * v_discount_ratio, 2);

  update quotes set
    subtotal_ht = v_subtotal_ht,
    tax_amount = v_tax_amount,
    total_ht = v_total_ht,
    total_ttc = round(v_total_ht + v_tax_amount, 2)
  where id = p_quote_id;
end;
$$;

create or replace function trg_recompute_quote_totals_from_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform recompute_quote_totals(old.quote_id);
    return old;
  else
    perform recompute_quote_totals(new.quote_id);
    return new;
  end if;
end;
$$;

create trigger trg_quote_items_recompute
  after insert or update or delete on quote_items
  for each row execute function trg_recompute_quote_totals_from_items();

-- Cart-level discount changes on a quote go through this RPC so the
-- totals recompute atomically with the discount change (kept out of a
-- trigger on quotes itself to avoid update-triggers-update recursion).
create or replace function update_quote_discount(p_quote_id uuid, p_discount_amount numeric)
returns quotes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quote quotes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_discount_amount < 0 then
    raise exception 'discount_amount_must_be_non_negative';
  end if;

  update quotes set discount_amount = p_discount_amount where id = p_quote_id;
  perform recompute_quote_totals(p_quote_id);

  select * into v_quote from quotes where id = p_quote_id;
  return v_quote;
end;
$$;

grant execute on function update_quote_discount(uuid, numeric) to authenticated;
