-- =====================================================
-- Drivers Table
-- =====================================================
create table public.drivers (
  id uuid not null default gen_random_uuid (),
  company_id uuid not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  residential_address text not null,
  emergency_contact_name text not null,
  emergency_contact_phone text not null,
  passport_number text null,
  right_to_work_code text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  license_no text not null,
  status text null,
  dbs_service_update_id text null,
  nationality text null,
  fleet text not null default 'company',
  vehicle_assigned boolean not null default false,
  constraint drivers_pkey primary key (id),
  constraint drivers_fleet_check check (fleet in ('company', 'private')),
  constraint drivers_company_id_fkey foreign KEY (company_id) references companies (id) on delete CASCADE,
  constraint drivers_id_auth_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_drivers_company on public.drivers using btree (company_id) TABLESPACE pg_default;

create unique INDEX IF not exists uq_drivers_email on public.drivers using btree (email) TABLESPACE pg_default;

create index IF not exists idx_drivers_fleet on public.drivers using btree (company_id, fleet) TABLESPACE pg_default;

create index IF not exists idx_drivers_vehicle_assigned on public.drivers using btree (company_id, vehicle_assigned) TABLESPACE pg_default;

-- =====================================================
-- Driver Document 
-- =====================================================

create table public.driver_documents (
  id uuid not null default gen_random_uuid (),
  company_id uuid not null,
  driver_id uuid not null,
  document_type public.driver_document_type not null,
  file_url text not null,
  expiry_date date null,
  uploaded_at timestamp with time zone not null default now(),
  constraint driver_documents_pkey primary key (id),
  constraint driver_documents_company_id_fkey foreign KEY (company_id) references companies (id) on delete CASCADE,
  constraint driver_documents_driver_id_fkey foreign KEY (driver_id) references drivers (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_driver_documents_driver on public.driver_documents using btree (driver_id) TABLESPACE pg_default;

create index IF not exists idx_driver_documents_company on public.driver_documents using btree (company_id) TABLESPACE pg_default;



-- =====================================================
-- Vehicles Table
-- =====================================================

create table public.vehicles (
  id uuid not null default gen_random_uuid (),
  company_id uuid not null,
  driver_id uuid null,
  vehicle_photo_url text null,
  seating_capacity integer null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  taxi_license_plate_number text not null,
  name text null,
  registration_number text null,
  make text null,
  model text null,
  vehicle_colour text null,
  year_of_first_registration date null,
  licensing_type text null,
  body_style text null,
  wheelchair_accessible boolean not null default false,
  fleet text not null default 'company',
  status text not null default 'active',
  constraint vehicles_pkey primary key (id),
  constraint vehicles_fleet_check check (fleet in ('company', 'private')),
  constraint vehicles_status_check check (status in ('active', 'off_road')),
  constraint vehicles_company_id_fkey foreign KEY (company_id) references companies (id) on delete CASCADE,
  constraint vehicles_driver_id_fkey foreign KEY (driver_id) references drivers (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_vehicles_company on public.vehicles using btree (company_id) TABLESPACE pg_default;

create index IF not exists idx_vehicles_driver on public.vehicles using btree (driver_id) TABLESPACE pg_default;

create unique index IF not exists uq_vehicles_driver_id on public.vehicles using btree (driver_id) TABLESPACE pg_default
where (driver_id is not null);

create index IF not exists idx_vehicles_fleet on public.vehicles using btree (company_id, fleet) TABLESPACE pg_default;

create index IF not exists idx_vehicles_status on public.vehicles using btree (company_id, status) TABLESPACE pg_default;


-- =====================================================
-- Vehicle Documents Table
-- =====================================================

create table public.vehicle_documents (
  id uuid not null default gen_random_uuid (),
  company_id uuid not null,
  vehicle_id uuid not null,
  document_type public.vehicle_document_type not null,
  file_url text not null,
  expiry_date date null,
  uploaded_at timestamp with time zone not null default now(),
  constraint vehicle_documents_pkey primary key (id),
  constraint vehicle_documents_company_id_fkey foreign KEY (company_id) references companies (id) on delete CASCADE,
  constraint vehicle_documents_vehicle_id_fkey foreign KEY (vehicle_id) references vehicles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_vehicle_documents_vehicle on public.vehicle_documents using btree (vehicle_id) TABLESPACE pg_default;

create index IF not exists idx_vehicle_documents_company on public.vehicle_documents using btree (company_id) TABLESPACE pg_default;