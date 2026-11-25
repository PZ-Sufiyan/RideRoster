-- Run once: stamp historical PA assignment on sessions (mirrors driver_id).
-- Nullable so existing driver flows keep working before/after deploy.

alter table public.job_sessions
  add column if not exists pa_id uuid null
    references public.passenger_assistant (id)
    on delete set null;

create index if not exists idx_job_sessions_pa
  on public.job_sessions using btree (pa_id);

-- Optional one-time backfill for rows that still sit on a currently assigned PA job.
update public.job_sessions js
set pa_id = j.assigned_pa_id
from public.jobs j
where js.job_id = j.id
  and js.pa_id is null
  and j.assigned_pa_id is not null;
