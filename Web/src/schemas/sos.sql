-- =====================================================
-- SOS Status Enum
-- =====================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'sos_status') then
    create type sos_status as enum ('active', 'resolved', 'cancelled');
  end if;
end$$;

-- =====================================================
-- SOS Table
-- =====================================================

create table if not exists public.sos (
  id uuid primary key default gen_random_uuid(),

  vehicle_id uuid not null
    references public.vehicles(id)
    on delete cascade,

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  driver_id uuid
    references public.drivers(id)
    on delete set null,

  passenger_assistant_id uuid
    references public.passenger_assistant(id)
    on delete set null,

  longitude numeric(10, 7) not null,
  latitude numeric(10, 7) not null,

  number_of_passenger integer not null default 0 check (number_of_passenger >= 0),

  notes text,

  status sos_status not null default 'active',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- Indexes
-- =====================================================

create index if not exists idx_sos_vehicle_id
on public.sos(vehicle_id);

create index if not exists idx_sos_company_id
on public.sos(company_id);

create index if not exists idx_sos_driver_id
on public.sos(driver_id);

create index if not exists idx_sos_passenger_assistant_id
on public.sos(passenger_assistant_id);

create index if not exists idx_sos_status
on public.sos(status);

create index if not exists idx_sos_created_at
on public.sos(created_at desc);