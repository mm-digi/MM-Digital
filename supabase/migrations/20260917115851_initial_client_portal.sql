-- Staging schema for the future Supabase client portal.
-- This migration is intentionally not applied yet; the existing JWT login remains live.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.client_dashboards (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  embed_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.client_dashboard_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, client_id)
);

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.client_dashboards enable row level security;
alter table public.client_dashboard_access enable row level security;

revoke all on public.profiles from anon;
revoke all on public.clients from anon;
revoke all on public.client_dashboards from anon;
revoke all on public.client_dashboard_access from anon;
grant select on public.profiles, public.clients, public.client_dashboards, public.client_dashboard_access to authenticated;

create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can view their client access"
  on public.client_dashboard_access for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view assigned clients"
  on public.clients for select to authenticated
  using (exists (
    select 1 from public.client_dashboard_access access
    where access.client_id = clients.id and access.user_id = (select auth.uid())
  ));

create policy "Users can view assigned dashboards"
  on public.client_dashboards for select to authenticated
  using (exists (
    select 1 from public.client_dashboard_access access
    where access.client_id = client_dashboards.client_id and access.user_id = (select auth.uid())
  ));
