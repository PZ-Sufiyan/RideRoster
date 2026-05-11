-- Run once: allow status 'incomplete' (saved with any fail). 'pending' stays for
-- rows that exist but have not been through a checklist submit, or table default.
alter table public.vehicle_safety_checks
  drop constraint if exists vehicle_safety_checks_status_check;

alter table public.vehicle_safety_checks
  add constraint vehicle_safety_checks_status_check check (
    status = any (array['pending'::text, 'incomplete'::text, 'completed'::text])
  );
