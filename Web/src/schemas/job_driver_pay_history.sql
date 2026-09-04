-- Approved driver pay history.
-- One row per approved driver-on-job period. Pending / rejected / counter offers are not stored.
-- A database trigger on jobs opens a row when pay is approved and closes it when the
-- assignment ends or the approved rate changes.
-- Run in Supabase SQL Editor (safe to re-run).

create table if not exists public.job_driver_pay_history (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies (id) on delete cascade,
  job_id        uuid not null references public.jobs (id) on delete cascade,
  driver_id     uuid null references public.drivers (id) on delete set null,
  approved_pay  numeric(10, 2) null,
  approved_at   timestamptz not null default now(),
  ended_at      timestamptz null,
  end_reason    text null
                check (
                  end_reason is null
                  or end_reason in (
                    'completed',
                    'left',
                    'removed',
                    'suspended',
                    'reassigned',
                    'cancelled',
                    'rate_changed'
                  )
                ),
  created_at    timestamptz not null default now(),
  constraint job_driver_pay_history_pay_check
    check (approved_pay is null or approved_pay >= 0),
  constraint job_driver_pay_history_ended_check
    check (
      (ended_at is null and end_reason is null)
      or (ended_at is not null and end_reason is not null)
    )
);

create index if not exists idx_job_driver_pay_history_job
  on public.job_driver_pay_history using btree (job_id, approved_at desc);

create index if not exists idx_job_driver_pay_history_driver
  on public.job_driver_pay_history using btree (driver_id, approved_at desc);

create index if not exists idx_job_driver_pay_history_company
  on public.job_driver_pay_history using btree (company_id, approved_at desc);

create unique index if not exists uq_job_driver_pay_history_open_job
  on public.job_driver_pay_history (job_id)
  where ended_at is null;

grant select, insert, update on table public.job_driver_pay_history to service_role;
grant select on table public.job_driver_pay_history to authenticated;

alter table public.job_driver_pay_history enable row level security;

drop policy if exists "Portal users and assigned drivers read pay history"
  on public.job_driver_pay_history;

create policy "Portal users and assigned drivers read pay history"
  on public.job_driver_pay_history
  for select
  to authenticated
  using (
    driver_id = (select auth.uid())
    or exists (
      select 1
      from public.company_admins ca
      where ca.id = (select auth.uid())
        and ca.company_id = job_driver_pay_history.company_id
    )
    or exists (
      select 1
      from public.sub_admins sa
      where sa.id = (select auth.uid())
        and sa.company_id = job_driver_pay_history.company_id
    )
  );

-- ── Trigger helpers ───────────────────────────────────────────────────────────

create or replace function public.close_open_job_driver_pay_history(
  p_job_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_job_id is null or p_reason is null then
    return;
  end if;

  update public.job_driver_pay_history
  set
    ended_at = now(),
    end_reason = p_reason
  where job_id = p_job_id
    and ended_at is null;
end;
$$;

create or replace function public.open_job_driver_pay_history(
  p_job_id uuid,
  p_company_id uuid,
  p_driver_id uuid,
  p_approved_pay numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_job_id is null or p_driver_id is null or p_company_id is null then
    return;
  end if;

  if exists (
    select 1
    from public.job_driver_pay_history h
    where h.job_id = p_job_id
      and h.ended_at is null
      and h.driver_id is not distinct from p_driver_id
      and h.approved_pay is not distinct from p_approved_pay
  ) then
    return;
  end if;

  if exists (
    select 1
    from public.job_driver_pay_history h
    where h.job_id = p_job_id
      and h.ended_at is null
  ) then
    perform public.close_open_job_driver_pay_history(p_job_id, 'reassigned');
  end if;

  insert into public.job_driver_pay_history (
    job_id,
    company_id,
    driver_id,
    approved_pay,
    approved_at
  ) values (
    p_job_id,
    p_company_id,
    p_driver_id,
    p_approved_pay,
    now()
  );
end;
$$;

create or replace function public.job_driver_pay_history_unassign_reason(p_driver_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if p_driver_id is null then
    return 'removed';
  end if;

  select lower(trim(coalesce(status, '')))
  into v_status
  from public.drivers
  where id = p_driver_id;

  if v_status in ('suspend', 'suspended') then
    return 'suspended';
  end if;

  return 'removed';
end;
$$;

create or replace function public.sync_job_driver_pay_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  was_approved boolean := false;
  is_approved boolean := false;
  old_status text := '';
  new_status text := '';
  old_driver uuid := null;
  new_driver uuid := null;
begin
  new_status := lower(trim(coalesce(NEW.status, '')));
  new_driver := NEW.assigned_driver_id;
  is_approved := (
    new_driver is not null
    and lower(trim(coalesce(NEW.driver_approval_status, ''))) = 'accepted'
  );

  if TG_OP = 'UPDATE' then
    old_status := lower(trim(coalesce(OLD.status, '')));
    old_driver := OLD.assigned_driver_id;
    was_approved := (
      old_driver is not null
      and lower(trim(coalesce(OLD.driver_approval_status, ''))) = 'accepted'
    );
  end if;

  if new_status in ('cancelled', 'canceled', 'completed', 'complete')
     and old_status not in ('cancelled', 'canceled', 'completed', 'complete') then
    perform public.close_open_job_driver_pay_history(
      NEW.id,
      case
        when new_status in ('completed', 'complete') then 'completed'
        else 'cancelled'
      end
    );
    return NEW;
  end if;

  if was_approved then
    if not is_approved then
      perform public.close_open_job_driver_pay_history(
        NEW.id,
        case
          when new_driver is not null and new_driver is distinct from old_driver then 'reassigned'
          else public.job_driver_pay_history_unassign_reason(old_driver)
        end
      );
    elsif new_driver is distinct from old_driver then
      perform public.close_open_job_driver_pay_history(NEW.id, 'reassigned');
    elsif OLD.driver_pay is distinct from NEW.driver_pay then
      perform public.close_open_job_driver_pay_history(NEW.id, 'rate_changed');
    end if;
  end if;

  if is_approved and new_status not in ('cancelled', 'canceled', 'completed', 'complete') then
    perform public.open_job_driver_pay_history(
      NEW.id,
      NEW.company_id,
      new_driver,
      NEW.driver_pay
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_jobs_driver_pay_history on public.jobs;

create trigger trg_jobs_driver_pay_history
after insert or update on public.jobs
for each row
execute procedure public.sync_job_driver_pay_history();

revoke all on function public.close_open_job_driver_pay_history(uuid, text) from public;
revoke all on function public.open_job_driver_pay_history(uuid, uuid, uuid, numeric) from public;
revoke all on function public.job_driver_pay_history_unassign_reason(uuid) from public;
revoke all on function public.sync_job_driver_pay_history() from public;

grant execute on function public.close_open_job_driver_pay_history(uuid, text) to service_role;
grant execute on function public.open_job_driver_pay_history(uuid, uuid, uuid, numeric) to service_role;
grant execute on function public.job_driver_pay_history_unassign_reason(uuid) to service_role;

-- Existing accepted assignments (true accept time is unknown; use last job update).
insert into public.job_driver_pay_history (
  job_id,
  company_id,
  driver_id,
  approved_pay,
  approved_at
)
select
  j.id,
  j.company_id,
  j.assigned_driver_id,
  j.driver_pay,
  coalesce(j.updated_at, j.created_at, now())
from public.jobs j
where j.assigned_driver_id is not null
  and lower(trim(coalesce(j.driver_approval_status, ''))) = 'accepted'
  and lower(trim(coalesce(j.status, ''))) not in ('cancelled', 'canceled', 'completed', 'complete')
  and not exists (
    select 1
    from public.job_driver_pay_history h
    where h.job_id = j.id
      and h.ended_at is null
  );
