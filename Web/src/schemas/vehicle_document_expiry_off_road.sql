-- Auto Off-Road when a fleet (company) vehicle MOT / insurance / taxi plate expires.
-- Run in Supabase SQL Editor (safe to re-run).
-- Does not change the existing document-expiry reminder tables or scheduler.

-- ── Dedup: one Off-Road pass per document per expiry date ─────────────────────

create table if not exists public.vehicle_document_expiry_off_road_processed (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null,
  vehicle_id    uuid not null references public.vehicles (id) on delete cascade,
  company_id    uuid null references public.companies (id) on delete cascade,
  expiry_date   date not null,
  processed_at  timestamptz not null default now(),
  constraint uq_vehicle_document_expiry_off_road unique (document_id, expiry_date)
);

create index if not exists idx_vehicle_doc_expiry_off_road_vehicle
  on public.vehicle_document_expiry_off_road_processed using btree (vehicle_id, processed_at desc);

create index if not exists idx_vehicle_doc_expiry_off_road_company
  on public.vehicle_document_expiry_off_road_processed using btree (company_id, processed_at desc);

grant select, insert, delete on table public.vehicle_document_expiry_off_road_processed to service_role;
grant select on table public.vehicle_document_expiry_off_road_processed to authenticated;

alter table public.vehicle_document_expiry_off_road_processed enable row level security;

drop policy if exists "Portal users read company vehicle expiry off-road processed"
  on public.vehicle_document_expiry_off_road_processed;

create policy "Portal users read company vehicle expiry off-road processed"
  on public.vehicle_document_expiry_off_road_processed
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.company_admins ca
      where ca.id = (select auth.uid())
        and ca.company_id = vehicle_document_expiry_off_road_processed.company_id
    )
    or exists (
      select 1
      from public.sub_admins sa
      where sa.id = (select auth.uid())
        and sa.company_id = vehicle_document_expiry_off_road_processed.company_id
    )
  );

-- ── Allow Off-Road portal events ──────────────────────────────────────────────

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
