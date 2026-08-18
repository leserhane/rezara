-- Enable Supabase Realtime (logical replication) for the tables the
-- frontend subscribes to, so a sale/payment/stock change made on one
-- device is pushed live to every other connected session without a
-- manual refresh (spec #37).
--
-- NOTE: Supabase projects already have the `supabase_realtime`
-- publication created for you; this just adds tables to it. If running
-- against a Supabase project, this is all you need — Realtime picks it
-- up automatically. (On a bare local Postgres this statement is a no-op
-- error if the publication doesn't exist, so local_dev test runs skip it.)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table sales;
    alter publication supabase_realtime add table sale_items;
    alter publication supabase_realtime add table payments;
    alter publication supabase_realtime add table products;
    alter publication supabase_realtime add table stock_movements;
    alter publication supabase_realtime add table cash_registers;
    alter publication supabase_realtime add table cash_movements;
    alter publication supabase_realtime add table orders;
    alter publication supabase_realtime add table notifications;
    alter publication supabase_realtime add table customers;
  end if;
end $$;
