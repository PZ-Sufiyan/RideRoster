-- Job lifecycle status: upcoming | active | completed | cancelled
-- Run once in Supabase SQL Editor (safe to re-run).
-- Backfills existing rows from semester dates. Cancelled rows are left unchanged.

update public.jobs
set
  status = case
    when lower(trim(coalesce(status, ''))) in ('cancelled', 'canceled') then status
    when semester_end is not null
      and current_date > semester_end then 'completed'
    when semester_start is not null
      and current_date >= semester_start
      and (semester_end is null or current_date <= semester_end) then 'active'
    when semester_start is not null
      and current_date < semester_start then 'upcoming'
    else status
  end,
  updated_at = now()
where lower(trim(coalesce(status, ''))) not in ('cancelled', 'canceled');
