-- =====================================================
-- PA type (company vs private), matching drivers.fleet.
-- Run this on the existing database (Supabase SQL editor).
--
-- Private PA  → registered from the mobile app
-- Company PA  → registered from the admin / sub-admin portal
-- =====================================================

alter table public.passenger_assistant
  add column if not exists fleet text not null default 'company';

update public.passenger_assistant
set fleet = 'company'
where fleet is null or fleet = '';

alter table public.passenger_assistant drop constraint if exists passenger_assistant_fleet_check;
alter table public.passenger_assistant
  add constraint passenger_assistant_fleet_check check (fleet in ('company', 'private'));

create index if not exists idx_passenger_assistant_fleet
  on public.passenger_assistant using btree (company_id, fleet);
