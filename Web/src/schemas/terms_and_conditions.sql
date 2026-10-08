-- Per-company versioned Terms & Conditions (mobile staff) + acceptance tracking.
-- Run in Supabase SQL Editor (safe to re-run where noted).

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'terms_audience') then
    create type public.terms_audience as enum (
      'private_driver',
      'company_driver',
      'private_pa',
      'company_pa'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.terms_and_conditions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  audience public.terms_audience not null,
  version text not null check (char_length(trim(version)) > 0),
  title text not null default 'Terms & Conditions',
  content text not null,
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users (id) on delete set null,
  constraint terms_and_conditions_company_audience_version_key unique (company_id, audience, version)
);

create index if not exists idx_terms_and_conditions_company_audience_version
  on public.terms_and_conditions using btree (company_id, audience, version desc);

create index if not exists idx_terms_and_conditions_company_audience_published
  on public.terms_and_conditions using btree (company_id, audience, published_at desc nulls last)
  where published_at is not null;

create table if not exists public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  terms_id uuid not null references public.terms_and_conditions (id) on delete restrict,
  terms_version text not null,
  audience public.terms_audience not null,
  accepted_at timestamptz not null default now(),
  constraint terms_acceptances_user_terms_key unique (user_id, terms_id)
);

create index if not exists idx_terms_acceptances_user
  on public.terms_acceptances using btree (user_id, accepted_at desc);

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER — used by RLS and RPC)
-- ---------------------------------------------------------------------------
create or replace function public.auth_role_for_user(p_user_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select raw_app_meta_data ->> 'role' from auth.users where id = p_user_id),
    (select raw_user_meta_data ->> 'role' from auth.users where id = p_user_id)
  );
$$;

create or replace function public.staff_company_id(p_user_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select company_id from public.drivers where id = p_user_id),
    (select company_id from public.passenger_assistant where id = p_user_id)
  );
$$;

create or replace function public.staff_terms_audience(p_user_id uuid)
returns public.terms_audience
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_role text;
  v_fleet text;
begin
  v_role := public.auth_role_for_user(p_user_id);
  if v_role = 'driver' then
    select fleet into v_fleet from public.drivers where id = p_user_id;
    if coalesce(v_fleet, 'company') = 'private' then
      return 'private_driver'::public.terms_audience;
    end if;
    return 'company_driver'::public.terms_audience;
  elsif v_role = 'passenger_assistant' then
    select fleet into v_fleet from public.passenger_assistant where id = p_user_id;
    if coalesce(v_fleet, 'company') = 'private' then
      return 'private_pa'::public.terms_audience;
    end if;
    return 'company_pa'::public.terms_audience;
  end if;
  return null;
end;
$$;

create or replace function public.portal_company_admin_company_id(p_user_id uuid default auth.uid())
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select ca.company_id
  from public.company_admins ca
  join public.companies c on c.id = ca.company_id
  where ca.id = p_user_id
    and lower(coalesce(c.status, '')) = 'approved';
$$;

create or replace function public.portal_company_admin_owns_company(p_company_id uuid)
returns boolean
language sql
stable
as $$
  select public.portal_company_admin_company_id(auth.uid()) = p_company_id;
$$;

create or replace function public.latest_published_terms_row(
  p_company_id uuid,
  p_audience public.terms_audience
)
returns public.terms_and_conditions
language sql
security definer
set search_path = public
stable
as $$
  select t.*
  from public.terms_and_conditions t
  where t.company_id = p_company_id
    and t.audience = p_audience
    and t.published_at is not null
  order by t.published_at desc nulls last, t.created_at desc
  limit 1;
$$;

create or replace function public.staff_has_accepted_required_terms(p_user_id uuid default auth.uid())
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_company_id uuid;
  v_audience public.terms_audience;
  v_latest public.terms_and_conditions;
begin
  if p_user_id is null then
    return false;
  end if;

  v_company_id := public.staff_company_id(p_user_id);
  v_audience := public.staff_terms_audience(p_user_id);
  if v_company_id is null or v_audience is null then
    return true;
  end if;

  select * into v_latest
  from public.latest_published_terms_row(v_company_id, v_audience);
  if v_latest.id is null then
    return true;
  end if;

  return exists (
    select 1
    from public.terms_acceptances a
    where a.user_id = p_user_id
      and a.terms_id = v_latest.id
  );
end;
$$;

-- Mobile: fetch required terms (null if none / already accepted).
create or replace function public.get_required_terms_for_user()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_uid uuid := auth.uid();
  v_company_id uuid;
  v_audience public.terms_audience;
  v_latest public.terms_and_conditions;
begin
  if v_uid is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  v_company_id := public.staff_company_id(v_uid);
  v_audience := public.staff_terms_audience(v_uid);
  if v_company_id is null or v_audience is null then
    return jsonb_build_object('required', false);
  end if;

  select * into v_latest
  from public.latest_published_terms_row(v_company_id, v_audience);
  if v_latest.id is null then
    return jsonb_build_object(
      'required', false,
      'audience', v_audience::text,
      'company_id', v_company_id
    );
  end if;

  if exists (
    select 1 from public.terms_acceptances
    where user_id = v_uid and terms_id = v_latest.id
  ) then
    return jsonb_build_object(
      'required', false,
      'audience', v_audience::text,
      'company_id', v_company_id,
      'latest_version', v_latest.version
    );
  end if;

  return jsonb_build_object(
    'required', true,
    'audience', v_audience::text,
    'company_id', v_company_id,
    'terms_id', v_latest.id,
    'version', v_latest.version,
    'title', v_latest.title,
    'content', v_latest.content
  );
end;
$$;

-- Mobile: record acceptance (validates latest published terms for user's company + audience).
create or replace function public.accept_required_terms(p_terms_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_company_id uuid;
  v_audience public.terms_audience;
  v_latest public.terms_and_conditions;
  v_terms public.terms_and_conditions;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'not_authenticated');
  end if;

  v_company_id := public.staff_company_id(v_uid);
  v_audience := public.staff_terms_audience(v_uid);
  if v_company_id is null or v_audience is null then
    return jsonb_build_object('success', false, 'error', 'not_applicable');
  end if;

  select * into v_latest
  from public.latest_published_terms_row(v_company_id, v_audience);
  if v_latest.id is null then
    return jsonb_build_object('success', true, 'skipped', true);
  end if;

  if p_terms_id is distinct from v_latest.id then
    return jsonb_build_object('success', false, 'error', 'stale_terms_version');
  end if;

  select * into v_terms
  from public.terms_and_conditions
  where id = p_terms_id
    and company_id = v_company_id
    and audience = v_audience
    and published_at is not null;

  if v_terms.id is null then
    return jsonb_build_object('success', false, 'error', 'invalid_terms');
  end if;

  insert into public.terms_acceptances (
    user_id,
    company_id,
    terms_id,
    terms_version,
    audience
  )
  values (
    v_uid,
    v_company_id,
    v_terms.id,
    v_terms.version,
    v_audience
  )
  on conflict (user_id, terms_id) do nothing;

  return jsonb_build_object('success', true, 'version', v_terms.version);
end;
$$;

grant execute on function public.get_required_terms_for_user() to authenticated;
grant execute on function public.accept_required_terms(uuid) to authenticated;
grant execute on function public.staff_has_accepted_required_terms(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Migration: integer auto-versions → manual version strings (existing DBs)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'terms_and_conditions'
      and column_name = 'version'
      and data_type = 'integer'
  ) then
    alter table public.terms_and_conditions
      drop constraint if exists terms_and_conditions_version_check;

    alter table public.terms_and_conditions
      alter column version type text using version::text;

    alter table public.terms_and_conditions
      add constraint terms_and_conditions_version_check
      check (char_length(trim(version)) > 0);

    alter table public.terms_acceptances
      alter column terms_version type text using terms_version::text;
  end if;
end $$;

drop function if exists public.next_terms_version(uuid, public.terms_audience);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.terms_and_conditions enable row level security;
alter table public.terms_acceptances enable row level security;

drop policy if exists "Staff read published terms for own audience" on public.terms_and_conditions;
drop policy if exists "Superadmin manage terms" on public.terms_and_conditions;
drop policy if exists "Company admin manage company terms" on public.terms_and_conditions;
drop policy if exists "Staff read own acceptances" on public.terms_acceptances;
drop policy if exists "Superadmin read acceptances" on public.terms_acceptances;
drop policy if exists "Company admin read company acceptances" on public.terms_acceptances;

create policy "Staff read published terms for own company audience"
  on public.terms_and_conditions
  for select
  to authenticated
  using (
    published_at is not null
    and company_id = public.staff_company_id(auth.uid())
    and audience = public.staff_terms_audience(auth.uid())
  );

create policy "Company admin manage company terms"
  on public.terms_and_conditions
  for all
  to authenticated
  using (company_id = public.portal_company_admin_company_id(auth.uid()))
  with check (company_id = public.portal_company_admin_company_id(auth.uid()));

create policy "Staff read own acceptances"
  on public.terms_acceptances
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Company admin read company acceptances"
  on public.terms_acceptances
  for select
  to authenticated
  using (company_id = public.portal_company_admin_company_id(auth.uid()));

grant select, insert, update, delete on table public.terms_and_conditions to authenticated;
grant select on table public.terms_acceptances to authenticated;

-- Acceptance inserts only via accept_required_terms() (SECURITY DEFINER).

-- Backend gate: staff leave requests require current terms acceptance.
drop policy if exists "Staff insert own leave requests" on public.leave_requests;
create policy "Staff insert own leave requests"
  on public.leave_requests
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.staff_has_accepted_required_terms(auth.uid())
  );
