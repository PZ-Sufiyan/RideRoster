-- Store the driver's device IANA timezone (e.g. Europe/London, Asia/Karachi)
-- so job reminders fire at the correct local wall-clock time.
-- Run in Supabase SQL editor after device_push_tokens exists.

alter table public.device_push_tokens
  add column if not exists timezone text null;
