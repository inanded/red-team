-- Intentionally vulnerable fixture migration.
-- The status enum below omits 'past_due', which is a valid Stripe subscription
-- status. Events carrying that status will either fail to insert or silently
-- coerce to another value, leaving the subscription record stuck.

create type public.sub_status as enum (
  'active',
  'trialing',
  'canceled',
  'incomplete'
);

create table if not exists public.subscriptions (
  id text primary key,
  org_id uuid not null references public.orgs(id) on delete cascade,
  status public.sub_status not null,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
