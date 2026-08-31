-- Track who resolved open job reassignment alerts and which driver was assigned.
-- Run in Supabase SQL Editor (safe to re-run).

alter table public.job_reassignment_alerts
  add column if not exists resolved_by_id uuid null references auth.users (id) on delete set null;

alter table public.job_reassignment_alerts
  add column if not exists resolved_by_name text null;

alter table public.job_reassignment_alerts
  add column if not exists new_driver_id uuid null references public.drivers (id) on delete set null;

create index if not exists idx_job_reassignment_alerts_resolved_by
  on public.job_reassignment_alerts using btree (resolved_by_id, resolved_at desc)
  where resolved_by_id is not null;
