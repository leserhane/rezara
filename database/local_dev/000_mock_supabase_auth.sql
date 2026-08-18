-- LOCAL DEV / TESTING ONLY.
--
-- Supabase provisions a real `auth` schema (auth.users, auth.uid(), ...)
-- automatically — never run this file against a Supabase project. It only
-- exists so the migrations + RPC functions in ../migrations can be
-- exercised against a plain local Postgres instance in this sandbox,
-- mimicking just enough of Supabase Auth to prove the schema and business
-- logic are correct before a real Supabase project exists.

create schema if not exists auth;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  encrypted_password text not null,
  created_at timestamptz not null default now()
);

-- Real Supabase sets `request.jwt.claims` from the caller's JWT; we mimic
-- auth.uid() by reading a session variable the test script sets explicitly
-- with `select set_config('app.current_user_id', '<uuid>', false);`.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;
