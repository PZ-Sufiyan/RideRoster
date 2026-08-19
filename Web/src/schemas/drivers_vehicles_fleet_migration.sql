-- =====================================================
-- Fleet + 1:1 driver/vehicle assignment
-- Run this on the existing database (Supabase SQL editor).
-- =====================================================

alter table public.drivers
  add column if not exists fleet text not null default 'company';

alter table public.drivers
  add column if not exists vehicle_assigned boolean not null default false;

alter table public.vehicles
  add column if not exists fleet text not null default 'company';

update public.drivers
set fleet = 'company'
where fleet is null or fleet = '';

update public.vehicles
set fleet = 'company'
where fleet is null or fleet = '';

-- Existing drivers are already linked to a vehicle.
update public.drivers d
set vehicle_assigned = exists (
  select 1 from public.vehicles v where v.driver_id = d.id
);

alter table public.drivers drop constraint if exists drivers_fleet_check;
alter table public.drivers
  add constraint drivers_fleet_check check (fleet in ('company', 'private'));

alter table public.vehicles drop constraint if exists vehicles_fleet_check;
alter table public.vehicles
  add constraint vehicles_fleet_check check (fleet in ('company', 'private'));

create unique index if not exists uq_vehicles_driver_id
  on public.vehicles using btree (driver_id)
  where driver_id is not null;

create index if not exists idx_drivers_fleet
  on public.drivers using btree (company_id, fleet);

create index if not exists idx_vehicles_fleet
  on public.vehicles using btree (company_id, fleet);

create index if not exists idx_drivers_vehicle_assigned
  on public.drivers using btree (company_id, vehicle_assigned);
