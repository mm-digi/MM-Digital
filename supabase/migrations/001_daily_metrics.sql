alter table public.clients
  add column if not exists windsor_account_name text,
  add column if not exists ga4_property_id text;

create table if not exists public.daily_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  date date not null,
  source text not null,
  sessions numeric,
  users numeric,
  conversions numeric,
  impressions numeric,
  reach numeric,
  clicks numeric,
  spend numeric,
  engagement numeric,
  followers numeric,
  extra jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (client_id, date, source)
);

create index if not exists daily_metrics_client_date_idx
  on public.daily_metrics (client_id, date desc);

alter table public.daily_metrics enable row level security;

drop policy if exists "metrics readable by assigned users" on public.daily_metrics;
create policy "metrics readable by assigned users"
  on public.daily_metrics
  for select
  using (
    exists (
      select 1
      from public.client_dashboard_access a
      where a.client_id = daily_metrics.client_id
        and a.user_id = auth.uid()
    )
  );
