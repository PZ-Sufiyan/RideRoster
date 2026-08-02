-- Country → allowed license types lookup
-- Run in Supabase SQL Editor when ready to use

create table public.country_license_types (
  id uuid not null default gen_random_uuid (),
  country text not null,
  license_types text[] not null default '{}'::text[],
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint country_license_types_pkey primary key (id),
  constraint country_license_types_country_key unique (country),
  constraint country_license_types_country_not_blank check (btrim(country) <> '')
) TABLESPACE pg_default;

-- Prevent duplicates that differ only by case or surrounding spaces
-- e.g. 'United Kingdom' and 'united kingdom' cannot both exist
create unique index if not exists country_license_types_country_ci_uidx
  on public.country_license_types (lower(btrim(country)));

-- Optional starter rows (edit license_types as needed)
insert into public.country_license_types (country, license_types)
values
  ('United Kingdom', array['PCV', 'D1', 'D', 'B']),
  ('Pakistan', array['LTV', 'HTV', 'PSV']),
  ('United States of America', array['CDL Class A', 'CDL Class B', 'CDL Class C'])
on conflict (country) do nothing;
