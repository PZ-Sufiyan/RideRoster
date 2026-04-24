-- Passenger Bookings table
create table if not exists public.passenger (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  passenger_id uuid not null
    references public.passenger(id)
    on delete cascade,

  -- passenger details
  first_name text not null,
  surname text not null,
  email text,

  -- phone numbers (store as text to support +44 / spaces / leading zeros)
  contact_number_1 text not null,
  contact_number_2 text,

  -- pickup (home)
  pickup_address text not null,
  pickup_postal_code text not null,
  pickup_time time not null,

  -- drop-off (school)
  dropoff_address text not null,
  dropoff_postal_code text not null,
  dropoff_time time not null,

  pickup_latitude double precision,
  pickup_longitude double precision,
  dropoff_latitude double precision,
  dropoff_longitude double precision,

  wheelchair_required boolean not null default false,
  notes text,
  assigned_job_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_passenger_company_id
on public.passenger(company_id);