-- tenants table
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- profiles (maps auth.users to app user)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id),
  role text not null default 'driver',
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
