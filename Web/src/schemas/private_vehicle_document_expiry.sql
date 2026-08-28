-- Private vehicle document expiry → keep vehicle assignment, remove driver from jobs.
-- Run in Supabase SQL Editor (safe to re-run).
-- Does not change the company-fleet Off-Road expiry scheduler.

-- ── Dedup: one private expiry pass per document per expiry date ───────────────

create table if not exists public.private_vehicle_document_expiry_processed (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null,
  vehicle_id    uuid not null references public.vehicles (id) on delete cascade,
  company_id    uuid null references public.companies (id) on delete cascade,
  driver_id     uuid null references public.drivers (id) on delete set null,
  expiry_date   date not null,
  processed_at  timestamptz not null default now(),
  constraint uq_private_vehicle_document_expiry unique (document_id, expiry_date)
);

create index if not exists idx_private_vehicle_doc_expiry_vehicle
  on public.private_vehicle_document_expiry_processed using btree (vehicle_id, processed_at desc);

create index if not exists idx_private_vehicle_doc_expiry_company
  on public.private_vehicle_document_expiry_processed using btree (company_id, processed_at desc);

grant select, insert, delete on table public.private_vehicle_document_expiry_processed to service_role;
grant select on table public.private_vehicle_document_expiry_processed to authenticated;

alter table public.private_vehicle_document_expiry_processed enable row level security;

drop policy if exists "Portal users read company private vehicle expiry processed"
  on public.private_vehicle_document_expiry_processed;

create policy "Portal users read company private vehicle expiry processed"
  on public.private_vehicle_document_expiry_processed
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.company_admins ca
      where ca.id = (select auth.uid())
        and ca.company_id = private_vehicle_document_expiry_processed.company_id
    )
    or exists (
      select 1
      from public.sub_admins sa
      where sa.id = (select auth.uid())
        and sa.company_id = private_vehicle_document_expiry_processed.company_id
    )
  );

-- ── Priority alerts: driver removed from job due to expired private vehicle docs

create table if not exists public.private_driver_job_removal_alerts (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies (id) on delete cascade,
  driver_id        uuid not null references public.drivers (id) on delete cascade,
  vehicle_id       uuid not null references public.vehicles (id) on delete cascade,
  job_id           uuid not null references public.jobs (id) on delete cascade,
  title            text not null,
  body             text not null,
  payload          jsonb not null default '{}'::jsonb,
  status           text not null default 'open'
                   check (status in ('open', 'resolved')),
  created_at       timestamptz not null default now(),
  last_notified_at timestamptz not null default now(),
  resolved_at      timestamptz null
);

create index if not exists idx_private_driver_job_removal_alerts_company
  on public.private_driver_job_removal_alerts using btree (company_id, created_at desc);

create index if not exists idx_private_driver_job_removal_alerts_open
  on public.private_driver_job_removal_alerts using btree (status, last_notified_at)
  where status = 'open';

-- Only one open alert per job+driver; resolved history may repeat.
create unique index if not exists uq_private_driver_job_removal_alert_open
  on public.private_driver_job_removal_alerts (job_id, driver_id)
  where status = 'open';

grant select, insert, update on table public.private_driver_job_removal_alerts to service_role;
grant select on table public.private_driver_job_removal_alerts to authenticated;

alter table public.private_driver_job_removal_alerts enable row level security;

drop policy if exists "Portal users read company private driver job removal alerts"
  on public.private_driver_job_removal_alerts;

create policy "Portal users read company private driver job removal alerts"
  on public.private_driver_job_removal_alerts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.company_admins ca
      where ca.id = (select auth.uid())
        and ca.company_id = private_driver_job_removal_alerts.company_id
    )
    or exists (
      select 1
      from public.sub_admins sa
      where sa.id = (select auth.uid())
        and sa.company_id = private_driver_job_removal_alerts.company_id
    )
  );

alter table public.private_driver_job_removal_alerts replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.private_driver_job_removal_alerts;
exception
  when duplicate_object then null;
end $$;

-- ── Notification type extensions ──────────────────────────────────────────────

alter table public.user_notifications
  drop constraint if exists user_notifications_notification_type_check;

alter table public.user_notifications
  add constraint user_notifications_notification_type_check
  check (
    notification_type in (
      'message',
      'leave_status',
      'job_assignment',
      'document_expiry',
      'vehicle_assigned',
      'vehicle_unassigned',
      'vehicle_off_road',
      'job_removed'
    )
  );

alter table public.vehicle_event_notifications
  drop constraint if exists vehicle_event_notifications_event_type_check;

alter table public.vehicle_event_notifications
  add constraint vehicle_event_notifications_event_type_check
  check (
    event_type in (
      'vehicle_assigned',
      'vehicle_unassigned',
      'vehicle_set_active',
      'vehicle_off_road',
      'vehicle_document_expired'
    )
  );
