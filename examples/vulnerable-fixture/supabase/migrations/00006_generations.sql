create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  prompt text not null,
  response text,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_counters (
  user_id uuid primary key references public.users(id) on delete cascade,
  month text not null,
  count integer not null default 0
);
