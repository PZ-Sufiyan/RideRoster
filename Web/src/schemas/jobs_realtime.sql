-- Run in Supabase SQL Editor if driver approval / job fields do not update via Realtime.
--
-- 1) Full row image on UPDATE so payloads include company_id, driver_approval_status, etc.
-- 2) Ensure jobs is in the Realtime publication (safe to run if already added).

ALTER TABLE public.jobs REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
