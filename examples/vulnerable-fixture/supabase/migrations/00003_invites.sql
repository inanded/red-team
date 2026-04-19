-- Intentionally vulnerable fixture migration.
-- Invite codes are drawn from a sequential integer column rendered as a short
-- decimal string, which is brute-forceable by any external caller who can hit
-- the redemption endpoint.

create sequence if not exists public.invite_code_seq start 1;

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  email text not null,
  code text not null default lpad(nextval('public.invite_code_seq')::text, 6, '0'),
  redeemed boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.invites(code);
