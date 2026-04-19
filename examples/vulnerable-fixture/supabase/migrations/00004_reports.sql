create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  org_id uuid references public.orgs(id) on delete set null,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy reports_select_own on public.reports
  for select
  to authenticated
  using (owner_id = auth.uid());
