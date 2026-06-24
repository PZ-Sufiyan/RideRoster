-- Allow PA job-assignment notifications in user_notifications.
-- Run in Supabase SQL Editor (safe to re-run).

alter table public.user_notifications
  drop constraint if exists user_notifications_notification_type_check;

alter table public.user_notifications
  add constraint user_notifications_notification_type_check
  check (
    notification_type in ('message', 'leave_status', 'job_assignment')
  );
