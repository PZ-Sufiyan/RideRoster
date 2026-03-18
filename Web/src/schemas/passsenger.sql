create table if not exists public.passenger_info (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,

  first_name text not null,
  surname text not null,
  email text not null,
  phone text not null,

  residential_address text,
  profile_picture_url text,

  emergency_contact_name text,
  emergency_contact_phone text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_passenger_info_company
on public.passenger_info(company_id);

-- Safe enum creation
do $$
begin
  if not exists (select 1 from pg_type where typname = 'assistant_document_type') then
    create type public.assistant_document_type as enum (
      'passport',
      'safeguarding_certificate',
      'background_check',
      'first_aid_certificate'
    );
  end if;
end$$;

create table if not exists public.passenger_info_documents (
  id uuid primary key default gen_random_uuid(),

  passenger_id uuid not null
    references public.passenger_info(id)
    on delete cascade,

  document_type public.assistant_document_type not null,

  file_name text,
  file_url text not null,

  expiry_date date,
  verified boolean not null default false,

  uploaded_at timestamptz not null default now()
);

create index if not exists idx_passenger_info_documents_passenger_id
on public.passenger_info_documents(passenger_id);

create index if not exists idx_passenger_info_documents_type
on public.passenger_info_documents(document_type);

-- Optional: one doc per type per passenger
create unique index if not exists uq_passenger_doc_per_type
on public.passenger_info_documents(passenger_id, document_type);