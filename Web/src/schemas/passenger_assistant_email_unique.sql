-- Ensure passenger assistant emails are unique (same email cannot register twice as PA).
-- Auth.users already enforces one email globally across all roles.

create unique index if not exists uq_passenger_assistant_email
on public.passenger_assistant (lower(email));
