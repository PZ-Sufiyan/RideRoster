-- Vehicle assignment / status notifications.
-- Run in Supabase SQL Editor (safe to re-run).

-- ── Allow vehicle types in user_notifications (driver in-app + push) ──────────

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

-- ── Portal events for company admins and sub-admins ───────────────────────────

create table if not exists public.vehicle_event_notifications (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  vehicle_id  uuid not null references public.vehicles (id) on delete cascade,
  driver_id   uuid null references public.drivers (id) on delete set null,
  actor_id    uuid null references auth.users (id) on delete set null,
  event_type  text not null check (
    event_type in (
      'vehicle_assigned',
      'vehicle_unassigned',
      'vehicle_set_active',
      'vehicle_off_road',
      'vehicle_document_expired'
    )
  ),
  title       text not null,
  body        text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_vehicle_event_notifications_company
  on public.vehicle_event_notifications using btree (company_id, created_at desc);

create index if not exists idx_vehicle_event_notifications_vehicle
  on public.vehicle_event_notifications using btree (vehicle_id, created_at desc);

grant select, insert on table public.vehicle_event_notifications to service_role;
grant select on table public.vehicle_event_notifications to authenticated;

alter table public.vehicle_event_notifications enable row level security;

drop policy if exists "Portal users read company vehicle events"
  on public.vehicle_event_notifications;

create policy "Portal users read company vehicle events"
  on public.vehicle_event_notifications
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.company_admins ca
      where ca.id = (select auth.uid())
        and ca.company_id = vehicle_event_notifications.company_id
    )
    or exists (
      select 1
      from public.sub_admins sa
      where sa.id = (select auth.uid())
        and sa.company_id = vehicle_event_notifications.company_id
    )
  );

alter table public.vehicle_event_notifications replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.vehicle_event_notifications;
exception
  when duplicate_object then null;
end $$;
