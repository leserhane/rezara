-- Expenses paid out of the physical cash drawer must show up in the
-- register's movements (spec #20's "sorties de caisse"), the same way a
-- sale or payment does. A plain client-side INSERT into expenses can't
-- also atomically write the cash_movements row, so route it through an
-- RPC — consistent with every other financial write in this schema.
--
-- Expenses not paid from the register (e.g. bank transfer for rent) skip
-- p_cash_register_id and just insert the expense record directly (the
-- existing RLS policy already allows that for any authenticated user).

create or replace function record_expense(
  p_category_id uuid,
  p_amount_ht numeric,
  p_tax_amount numeric,
  p_payment_method_id uuid default null,
  p_cash_register_id uuid default null,
  p_supplier_id uuid default null,
  p_comment text default null,
  p_receipt_url text default null,
  p_expense_date date default current_date
) returns expenses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_expense expenses%rowtype;
  v_register cash_registers%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_amount_ht <= 0 then
    raise exception 'expense_amount_must_be_positive';
  end if;

  select * into v_profile from profiles where id = auth.uid();

  if p_cash_register_id is not null then
    if p_payment_method_id is null then
      raise exception 'payment_method_required_when_paying_from_cash_register';
    end if;
    select * into v_register from cash_registers where id = p_cash_register_id for update;
    if not found or v_register.status <> 'ouverte' then
      raise exception 'cash_register_not_open';
    end if;
  end if;

  insert into expenses (
    store_id, category_id, supplier_id, expense_date, amount_ht, tax_amount,
    payment_method_id, receipt_url, user_id, comment
  ) values (
    v_profile.store_id, p_category_id, p_supplier_id, p_expense_date, p_amount_ht, p_tax_amount,
    p_payment_method_id, p_receipt_url, auth.uid(), p_comment
  ) returning * into v_expense;

  if p_cash_register_id is not null then
    insert into cash_movements (cash_register_id, type, amount, payment_method_id, reference_type, reference_id, user_id, notes)
    values (p_cash_register_id, 'depense', v_expense.amount_ttc, p_payment_method_id, 'expense', v_expense.id, auth.uid(), p_comment);
  end if;

  perform write_audit_log('expense.create', 'expenses', 'expense', v_expense.id, null, to_jsonb(v_expense));

  return v_expense;
end;
$$;

grant execute on function record_expense(uuid, numeric, numeric, uuid, uuid, uuid, text, text, date) to authenticated;

-- Direct INSERT stays available for expenses not tied to the cash
-- register (kept from 010_expenses_revenues.sql's original policy), but
-- writes that DO reference a cash_register_id must go through the RPC so
-- the movement is never silently skipped.
