-- Job reassignment alerts: one tracking row per job + separate notification rows for history.
-- Hourly reminders insert new notification rows (never overwrite prior notifications).
-- Run in Supabase SQL Editor (safe to re-run).

create table if not exists public.job_reassignment_alerts (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies (id) on delete cascade,
  driver_id        uuid not null references public.drivers (id) on delete cascade,
  vehicle_id       uuid null references public.vehicles (id) on delete set null,
  job_id           uuid not null references public.jobs (id) on delete cascade,
  reason           text not null
                   check (reason in (
                     'company_vehicle_document_expiry',
                     'company_driver_document_expiry',
                     'private_vehicle_document_expiry',
                     'private_driver_document_expiry'
                   )),
  fleet            text null check (fleet is null or fleet in ('company', 'private')),
  record_type      text not null default 'notification'
                   check (record_type in ('tracking', 'notification')),
  title            text not null,
  body             text not null,
  payload          jsonb not null default '{}'::jsonb,
  status           text not null default 'sent'
                   check (status in ('open', 'resolved', 'sent')),
  created_at       timestamptz not null default now(),
  last_notified_at timestamptz null,
  resolved_at      timestamptz null,
  resolved_by_id   uuid null references auth.users (id) on delete set null,
  resolved_by_name text null,
  new_driver_id    uuid null references public.drivers (id) on delete set null
);

create index if not exists idx_job_reassignment_alerts_company
  on public.job_reassignment_alerts using btree (company_id, created_at desc);

create index if not exists idx_job_reassignment_alerts_notifications
  on public.job_reassignment_alerts using btree (company_id, created_at desc)
  where record_type = 'notification';

create index if not exists idx_job_reassignment_alerts_tracking_open
  on public.job_reassignment_alerts using btree (status, last_notified_at)
  where record_type = 'tracking' and status = 'open';

create unique index if not exists uq_job_reassignment_tracking_open
  on public.job_reassignment_alerts (job_id)
  where record_type = 'tracking' and status = 'open';

grant select, insert, update on table public.job_reassignment_alerts to service_role;
grant select on table public.job_reassignment_alerts to authenticated;

alter table public.job_reassignment_alerts enable row level security;

drop policy if exists "Portal users read company job reassignment alerts"
  on public.job_reassignment_alerts;

create policy "Portal users read company job reassignment alerts"
  on public.job_reassignment_alerts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.company_admins ca
      where ca.id = (select auth.uid())
        and ca.company_id = job_reassignment_alerts.company_id
    )
    or exists (
      select 1
      from public.sub_admins sa
      where sa.id = (select auth.uid())
        and sa.company_id = job_reassignment_alerts.company_id
    )
  );

alter table public.job_reassignment_alerts replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.job_reassignment_alerts;
exception
  when duplicate_object then null;
end $$;
