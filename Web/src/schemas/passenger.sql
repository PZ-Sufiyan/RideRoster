create table if not exists public.passenger (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  first_name text not null,
  last_name text not null,
  email text,

  contact_number_1 text not null,
  contact_number_2 text,

  residential_address text,
  postal_code text,

  date_of_birth date,
  profile_picture_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_passenger_company_id
on public.passenger(company_id);