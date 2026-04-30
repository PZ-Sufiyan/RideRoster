-- Passenger Bookings table
create table public.passenger (
  id uuid not null default gen_random_uuid (),
  company_id uuid not null,
  first_name text not null,
  surname text not null,
  email text null,
  contact_number_1 text not null,
  contact_number_2 text null,
  primary_pickup_address text not null,
  primary_pickup_postcode text not null,
  primary_pickup_time time without time zone not null,
  educational_site_address text not null,
  educational_site_postcode text not null,
  educational_site_dropoff_time time without time zone not null,
  wheelchair_required boolean not null default false,
  notes text null,
  assigned_job_id text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  status text not null default 'active'::text,
  primary_pickup_latitude text null,
  educational_site_latitude text null,
  educational_site_longitude text null,
  primary_pickup_longitude text null,
  harness_required boolean not null default false,
  weekly_schedule jsonb not null default '{"fri": false, "mon": false, "sat": false, "sun": false, "thu": false, "tue": false, "wed": false}'::jsonb,
  constraint passenger_pkey primary key (id),
  constraint passenger_company_id_fkey foreign KEY (company_id) references companies (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_passenger_company_id on public.passenger using btree (company_id) TABLESPACE pg_default;

-- =====================================================
-- Passenger Locations Table
-- =====================================================

create table public.passenger_locations (
  id uuid not null default gen_random_uuid (),
  passenger_id uuid not null,
  location_type text not null,
  address text not null,
  postcode text not null,
  latitude numeric(10, 7) null,
  longitude numeric(10, 7) null,
  label text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint passenger_locations_pkey primary key (id),
  constraint uq_passenger_location_type unique (passenger_id, location_type),
  constraint passenger_locations_passenger_id_fkey foreign KEY (passenger_id) references passenger (id) on delete CASCADE,
  constraint chk_location_type check (
    (
      location_type = any (
        array[
          'secondary_pickup'::text,
          'educational_site_1'::text,
          'respite'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_passenger_locations_passenger on public.passenger_locations using btree (passenger_id) TABLESPACE pg_default;





-- Indexes
create index if not exists idx_passenger_company_id
on public.passenger(company_id);