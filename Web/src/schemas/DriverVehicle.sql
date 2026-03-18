-- =====================================================
-- Drivers Table
-- =====================================================

create extension if not exists pgcrypto;

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,

  residential_address text not null,

  emergency_contact_name text not null,
  emergency_contact_phone text not null,

  passport_number text,
  right_to_work_code text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_drivers_company
on public.drivers(company_id);

create unique index if not exists uq_drivers_email
on public.drivers(email);


-- =====================================================
-- Driver Document Type Enum
-- =====================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'driver_document_type') then
    create type public.driver_document_type as enum (
      'driving_license_front',
      'driving_license_back',
      'taxi_badge_front',
      'taxi_badge_back',
      'dbs_certificate_front',
      'dbs_certificate_back',
      'safeguarding_certificate'
    );
  end if;
end$$;


-- =====================================================
-- Driver Documents Table
-- =====================================================

create table if not exists public.driver_documents (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  driver_id uuid not null
    references public.drivers(id)
    on delete cascade,

  document_type public.driver_document_type not null,

  file_url text not null,
  expiry_date date,

  uploaded_at timestamptz not null default now()
);

create index if not exists idx_driver_documents_driver
on public.driver_documents(driver_id);

create index if not exists idx_driver_documents_company
on public.driver_documents(company_id);


-- =====================================================
-- Vehicles Table
-- =====================================================

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  driver_id uuid
    references public.drivers(id)
    on delete set null,

  vehicle_photo_url text,

  seating_capacity integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicles_company
on public.vehicles(company_id);

create index if not exists idx_vehicles_driver
on public.vehicles(driver_id);


-- =====================================================
-- Vehicle Document Type Enum
-- =====================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'vehicle_document_type') then
    create type public.vehicle_document_type as enum (
      'v5_front',
      'v5_inside',
      'mot_certificate',
      'taxi_license_plate',
      'insurance_certificate'
    );
  end if;
end$$;


-- =====================================================
-- Vehicle Documents Table
-- =====================================================

create table if not exists public.vehicle_documents (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  vehicle_id uuid not null
    references public.vehicles(id)
    on delete cascade,

  document_type public.vehicle_document_type not null,

  file_url text not null,
  expiry_date date,

  uploaded_at timestamptz not null default now()
);

create index if not exists idx_vehicle_documents_vehicle
on public.vehicle_documents(vehicle_id);

create index if not exists idx_vehicle_documents_company
on public.vehicle_documents(company_id);