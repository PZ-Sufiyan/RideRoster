-- =====================================================
-- Vehicle status (active | off_road)
-- Run this on the existing database (Supabase SQL editor).
-- Existing rows become active. New rows default to active.
-- =====================================================

alter table public.vehicles
  add column if not exists status text not null default 'active';

update public.vehicles
set status = 'active'
where status is null or status = '';

alter table public.vehicles drop constraint if exists vehicles_status_check;
alter table public.vehicles
  add constraint vehicles_status_check check (status in ('active', 'off_road'));

create index if not exists idx_vehicles_status
  on public.vehicles using btree (company_id, status);
