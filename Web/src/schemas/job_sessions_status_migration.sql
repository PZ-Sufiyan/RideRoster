-- Run once: allow job_sessions.status values skipped and incomplete.
-- skipped    = morning session never started before morning_end + 30 min
-- incomplete = session started but not completed before the route deadline

alter table public.job_sessions
  drop constraint if exists job_sessions_status_check;

alter table public.job_sessions
  add constraint job_sessions_status_check check (
    status = any (
      array[
        'pending'::text,
        'active'::text,
        'completed'::text,
        'cancelled'::text,
        'skipped'::text,
        'incomplete'::text
      ]
    )
  );
