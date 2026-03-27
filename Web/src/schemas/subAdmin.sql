create table if not exists public.sub_admins (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  name text not null,
  email text not null,
  phone text,

  -- Job Management
  view_jobs boolean default false,
  create_jobs boolean default false,
  edit_jobs boolean default false,
  cancel_jobs boolean default false,

  -- User Management
  view_users boolean default false,
  add_users boolean default false,
  edit_profiles boolean default false,
  deactivate_users boolean default false,

  -- Reporting
  view_reports boolean default false,
  export_data boolean default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sub_admins_company
on public.sub_admins(company_id);

create unique index if not exists uq_sub_admins_email
on public.sub_admins(email);