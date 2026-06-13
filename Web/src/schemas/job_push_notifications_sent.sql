-- Tracks job start / reminder pushes so each driver only gets one per run.
-- Run in Supabase SQL editor before enabling the job scheduler.

create table if not exists public.job_push_notifications_sent (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid not null references public.jobs (id) on delete cascade,
  driver_id         uuid not null references public.drivers (id) on delete cascade,
  run_date          date not null,
  direction         text not null check (direction in ('outbound', 'inbound')),
  notification_type text not null check (notification_type in ('reminder_30', 'job_start')),
  sent_at           timestamptz not null default now(),
  constraint job_push_notifications_sent_unique
    unique (job_id, driver_id, run_date, direction, notification_type)
);

create index if not exists idx_job_push_sent_lookup
  on public.job_push_notifications_sent using btree (run_date, notification_type);

-- Only the push server (service role) writes this table.
alter table public.job_push_notifications_sent enable row level security;
