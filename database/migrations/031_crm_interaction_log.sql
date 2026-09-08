-- Turn the Rendez-vous corner of the app into a proper (in-app, no
-- external messaging) CRM: customer_notes becomes a typed interaction
-- log instead of a plain note, and every automated "who needs
-- attention" signal on the new Suivis page is computed from data that
-- already exists (tags, birth_date, appointments, v_customer_stats) —
-- no new infrastructure, consistent with how every other reminder in
-- this app works (recomputed on page load, nothing pushed).

alter table customer_notes add column if not exists type text not null default 'autre';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'customer_notes_type_check'
  ) then
    alter table customer_notes add constraint customer_notes_type_check
      check (type in ('appel', 'visite', 'email', 'whatsapp', 'sms', 'autre'));
  end if;
end $$;

create index if not exists idx_customer_notes_customer_created on customer_notes(customer_id, created_at desc);
