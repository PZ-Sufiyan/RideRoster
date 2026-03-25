create table public.companies (
    id uuid primary key default gen_random_uuid(),

    company_name text not null,
    company_registration_number text not null unique,
    company_type text not null,

    company_address text not null,
    company_operating_address text not null,
    company_email text not null,
    company_phone text not null,
    company_website text not null,
    company_preferred_language text not null,

    vat_number text,

    primary_business_activity text not null,
    driver_estimate integer,

    operator_licence_number text,
    operator_licence_issuing_authority text,

    coioe_registration_number text,
    coioe_issue_date date,

    cic_policy_number text,
    cic_coverage_amount text,
    cic_expiry_date date,
    status text not null default 'pending',
    notes text,

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.company_admins (
    id uuid primary key default gen_random_uuid(),

    company_id uuid references public.companies(id) on delete cascade,

    full_name text not null,
    email text not null,
    phone text not null,

    created_at timestamptz default now()
);

create type document_type as enum (
    'operator_license',
    'public_liability_insurance',
    'certificate_of_incorporation',
    'commercial_insurance_certificate',
    'vat_certificate',
    'primary_admin_id'
);


create table public.company_documents (
    id uuid primary key default gen_random_uuid(),

    company_id uuid references public.companies(id) on delete cascade,

    document_type document_type not null,
    file_name text,
    file_path text not null,
    file_url text not null,

    uploaded_at timestamptz default now()
);