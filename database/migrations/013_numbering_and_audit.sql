-- Document numbering (CL-000001, VTE-2026-000001, ...) & audit log helper

create table document_sequences (
  store_id uuid not null references stores(id) on delete cascade,
  doc_type text not null, -- 'customer', 'sale', 'quote', 'order', 'payment', 'invoice', 'expense'
  year integer not null default 0, -- 0 = not year-scoped (customers)
  last_value integer not null default 0,
  primary key (store_id, doc_type, year)
);

alter table document_sequences enable row level security;
create policy document_sequences_read on document_sequences for select using (auth.uid() is not null);

-- Returns the next formatted document number, e.g. 'VTE-2026-000001' or
-- 'CL-000001' for non-year-scoped types. Atomic via row locking.
create or replace function next_document_number(p_store_id uuid, p_doc_type text, p_year_scoped boolean default true)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer := case when p_year_scoped then extract(year from now())::integer else 0 end;
  v_next integer;
  v_prefix text;
  settings store_settings%rowtype;
begin
  select * into settings from store_settings where store_id = p_store_id;
  if not found then
    raise exception 'store_settings not found for store %', p_store_id;
  end if;

  v_prefix := case p_doc_type
    when 'customer' then settings.customer_number_prefix
    when 'sale' then settings.sale_number_prefix
    when 'quote' then settings.quote_number_prefix
    when 'order' then settings.order_number_prefix
    when 'payment' then settings.payment_number_prefix
    when 'invoice' then settings.invoice_number_prefix
    when 'expense' then settings.expense_number_prefix
    else upper(p_doc_type)
  end;

  insert into document_sequences (store_id, doc_type, year, last_value)
  values (p_store_id, p_doc_type, v_year, 1)
  on conflict (store_id, doc_type, year)
  do update set last_value = document_sequences.last_value + 1
  returning last_value into v_next;

  if p_year_scoped then
    return format('%s-%s-%s', v_prefix, v_year, lpad(v_next::text, 6, '0'));
  else
    return format('%s-%s', v_prefix, lpad(v_next::text, 6, '0'));
  end if;
end;
$$;

-- Generic audit log writer used by every RPC that mutates financial data.
create or replace function write_audit_log(
  p_action text, p_module text, p_entity_type text, p_entity_id uuid,
  p_old_value jsonb, p_new_value jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_logs (user_id, action, module, entity_type, entity_id, old_value, new_value)
  values (auth.uid(), p_action, p_module, p_entity_type, p_entity_id, p_old_value, p_new_value);
end;
$$;
