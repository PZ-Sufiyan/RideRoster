-- Ensure passenger assistant emails are unique among active (non-deleted) PAs.
-- Auth.users already enforces one email globally across all roles.
-- Deleted PAs keep their email on the profile row so the same email can register again.

drop index if exists public.uq_passenger_assistant_email;
drop index if exists public.uq_passenger_assistant_email_active;
create unique index if not exists uq_passenger_assistant_email_active
on public.passenger_assistant (lower(email))
where lower(coalesce(status, '')) is distinct from 'deleted';
