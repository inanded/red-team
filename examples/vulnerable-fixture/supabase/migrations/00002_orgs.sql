create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free',
  created_at timestamptz not null default now()
);

create table if not exists public.org_members (
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member',
  primary key (org_id, user_id)
);

alter table public.orgs enable row level security;
alter table public.org_members enable row level security;
