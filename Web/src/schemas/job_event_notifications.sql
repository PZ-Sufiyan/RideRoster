-- Job assignment / manual removal portal notifications for admins and sub-admins.
-- Run in Supabase SQL Editor (safe to re-run).

create table if not exists public.job_event_notifications (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  job_id      uuid not null references public.jobs (id) on delete cascade,
  driver_id   uuid null references public.drivers (id) on delete set null,
  actor_id    uuid null references auth.users (id) on delete set null,
  event_type  text not null check (
    event_type in (
      'job_driver_assigned',
      'job_driver_removed'
    )
  ),
  title       text not null,
  body        text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_job_event_notifications_company
  on public.job_event_notifications using btree (company_id, created_at desc);

create index if not exists idx_job_event_notifications_job
  on public.job_event_notifications using btree (job_id, created_at desc);

grant select, insert on table public.job_event_notifications to service_role;
grant select on table public.job_event_notifications to authenticated;

alter table public.job_event_notifications enable row level security;

drop policy if exists "Portal users read company job events"
  on public.job_event_notifications;

create policy "Portal users read company job events"
  on public.job_event_notifications
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.company_admins ca
      where ca.id = (select auth.uid())
        and ca.company_id = job_event_notifications.company_id
    )
    or exists (
      select 1
      from public.sub_admins sa
      where sa.id = (select auth.uid())
        and sa.company_id = job_event_notifications.company_id
    )
  );

alter table public.job_event_notifications replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.job_event_notifications;
exception
  when duplicate_object then null;
end $$;
