-- Extend job assignment / removal portal events to cover PAs.
-- Run in Supabase SQL Editor (safe to re-run).

alter table public.job_event_notifications
  add column if not exists pa_id uuid null references public.passenger_assistant (id) on delete set null;

do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.job_event_notifications'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%event_type%'
  loop
    execute format('alter table public.job_event_notifications drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.job_event_notifications
  add constraint job_event_notifications_event_type_check check (
    event_type in (
      'job_driver_assigned',
      'job_driver_removed',
      'job_pa_assigned',
      'job_pa_removed'
    )
  );

create index if not exists idx_job_event_notifications_pa
  on public.job_event_notifications using btree (pa_id, created_at desc)
  where pa_id is not null;
