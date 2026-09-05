-- Promote an existing Supabase Auth user to the admin role, creating
-- their profile row if it doesn't exist yet.
--
-- Prerequisite: the auth user must already exist (Supabase dashboard →
-- Authentication → Users → Add user, or they signed up themselves).
-- Logging in before this runs is safe — ProtectedRoute now shows a clear
-- "compte non configuré" message and a sign-out button instead of the
-- broken infinite-redirect loop it used to fall into.
--
-- Fill in the email and name below, then run the whole block.

insert into profiles (id, store_id, role_id, first_name, last_name, is_active)
select
  u.id,
  (select id from stores limit 1),
  (select id from roles where key = 'admin'),
  'FIRST_NAME',
  'LAST_NAME',
  true
from auth.users u
where u.email = 'REPLACE_WITH_EMAIL@example.com'
on conflict (id) do update set role_id = excluded.role_id, is_active = true;
