-- Auto-release assigned drivers when a job is completed.
-- Adds portal event type `job_completed` and driver in-app type `job_completed`.
-- Run in Supabase SQL Editor (safe to re-run).

-- ── Portal job events ─────────────────────────────────────────────────────────

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
      'job_pa_removed',
      'job_completed'
    )
  );

-- ── Driver / PA in-app notifications ──────────────────────────────────────────

alter table public.user_notifications
  drop constraint if exists user_notifications_notification_type_check;

alter table public.user_notifications
  add constraint user_notifications_notification_type_check
  check (
    notification_type in (
      'message',
      'leave_status',
      'job_assignment',
      'document_expiry',
      'vehicle_assigned',
      'vehicle_unassigned',
      'vehicle_off_road',
      'job_removed',
      'job_completed'
    )
  );
