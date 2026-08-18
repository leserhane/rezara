-- Grants for Supabase's PostgREST-facing roles.
-- `anon` gets nothing (the app requires authentication for everything);
-- `authenticated` gets table/view/sequence access gated by the RLS
-- policies defined above, and EXECUTE on the RPC functions.

grant usage on schema public to authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all sequences in schema public to authenticated;

grant execute on function auth_profile() to authenticated;
grant execute on function auth_role_key() to authenticated;
grant execute on function is_admin() to authenticated;
grant execute on function has_permission(text) to authenticated;
grant execute on function next_document_number(uuid, text, boolean) to authenticated;
grant execute on function write_audit_log(text, text, text, uuid, jsonb, jsonb) to authenticated;
grant execute on function apply_stock_movement(uuid, stock_movement_type, integer, text, text, uuid) to authenticated;
grant execute on function authorize_discount_override(text, text) to authenticated;
grant execute on function create_sale(uuid, jsonb, uuid, uuid, numeric, numeric, uuid, uuid, uuid, text) to authenticated;
grant execute on function record_payment(uuid, numeric, payment_type, uuid, uuid, text, text) to authenticated;
grant execute on function open_cash_register(numeric, text) to authenticated;
grant execute on function close_cash_register(uuid, numeric, text) to authenticated;
grant execute on function cancel_sale(uuid, text) to authenticated;

alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select on sequences to authenticated;
