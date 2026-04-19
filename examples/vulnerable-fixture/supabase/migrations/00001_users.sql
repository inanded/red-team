-- Intentionally vulnerable fixture migration.
-- The users_update_own policy below is missing a WITH CHECK clause, which
-- allows a user to rewrite the id column of their row during an UPDATE and
-- escalate to another user's record.

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'user',
  display_name text,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy users_select_own on public.users
  for select
  to authenticated
  using (id = auth.uid());

create policy users_update_own on public.users
  for update
  to authenticated
  using (id = auth.uid());
  -- missing: with check (id = auth.uid() and role = (select role from public.users where id = auth.uid()))
