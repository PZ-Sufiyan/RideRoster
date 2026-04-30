create table public.companies (
  id uuid not null default gen_random_uuid (),
  company_name text not null,
  company_registration_number text not null,
  company_type text not null,
  company_address text not null,
  company_operating_address text not null,
  company_email text not null,
  company_phone text not null,
  company_website text not null,
  company_preferred_language text not null,
  vat_number text null,
  primary_business_activity text not null,
  driver_estimate integer null,
  operator_licence_number text null,
  operator_licence_issuing_authority text null,
  coioe_registration_number text null,
  coioe_issue_date date null,
  cic_policy_number text null,
  cic_coverage_amount text null,
  cic_expiry_date date null,
  status text not null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  notes text null,
  constraint companies_pkey primary key (id),
  constraint companies_company_registration_number_key unique (company_registration_number)
) TABLESPACE pg_default;

-- id is the Supabase Auth user id (same as auth.users.id); set by app on insert/upsert, not generated.
create table public.company_admins (
  company_id uuid null,
  full_name text null,
  email text not null,
  phone text null,
  created_at timestamp with time zone not null default now(),
  id uuid not null,
  updated_at timestamp with time zone not null default now(),
  constraint company_admins_pkey primary key (id),
  constraint company_admins_id_key unique (id),
  constraint company_admins_company_id_fkey foreign KEY (company_id) references companies (id) on delete CASCADE,
  constraint company_admins_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create type document_type as enum (
    'operator_license',
    'public_liability_insurance',
    'certificate_of_incorporation',
    'commercial_insurance_certificate',
    'vat_certificate',
    'primary_admin_id'
);


create table public.company_documents (
  id uuid not null default gen_random_uuid (),
  company_id uuid null,
  document_type public.document_type not null,
  file_name text null,
  file_path text not null,
  file_url text not null,
  uploaded_at timestamp with time zone null default now(),
  constraint company_documents_pkey primary key (id),
  constraint company_documents_company_id_fkey foreign KEY (company_id) references companies (id) on delete CASCADE
) TABLESPACE pg_default;