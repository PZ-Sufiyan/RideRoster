-- Driver / PA in-app notifications and admin-to-driver messaging.
-- Run in your self-hosted Supabase SQL editor (Studio).

-- ── Admin → driver messages (permanent record, each send is a new row) ────────

create table if not exists public.admin_driver_messages (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies (id) on delete cascade,
  driver_id       uuid not null references public.drivers (id) on delete cascade,
  sender_admin_id uuid not null references auth.users (id) on delete cascade,
  message         text not null check (char_length(trim(message)) > 0),
  created_at      timestamptz not null default now()
);

create index if not exists idx_admin_driver_messages_driver_created
  on public.admin_driver_messages using btree (driver_id, created_at desc);

create index if not exists idx_admin_driver_messages_company
  on public.admin_driver_messages using btree (company_id);

-- ── Unified user notifications (message + leave status, etc.) ─────────────────

create table if not exists public.user_notifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  company_id        uuid null references public.companies (id) on delete set null,
  notification_type text not null check (
    notification_type in ('message', 'leave_status')
  ),
  title             text not null,
  body              text not null,
  payload           jsonb not null default '{}'::jsonb,
  reference_id      uuid null,
  read_at           timestamptz null,
  created_at        timestamptz not null default now()
);

create index if not exists idx_user_notifications_user_created
  on public.user_notifications using btree (user_id, created_at desc);

create index if not exists idx_user_notifications_user_unread
  on public.user_notifications using btree (user_id, read_at)
  where read_at is null;

create index if not exists idx_user_notifications_type
  on public.user_notifications using btree (user_id, notification_type);

-- ── RLS helpers ───────────────────────────────────────────────────────────────

create or replace function public.admin_can_message_user(target_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.company_admins ca
    join public.drivers d on d.company_id = ca.company_id and d.id = target_user_id
    where ca.id = (select auth.uid())
  )
  or exists (
    select 1
    from public.company_admins ca
    join public.passenger_assistant pa on pa.company_id = ca.company_id and pa.id = target_user_id
    where ca.id = (select auth.uid())
  )
  or exists (
    select 1
    from public.sub_admins sa
    join public.drivers d on d.company_id = sa.company_id and d.id = target_user_id
    where sa.id = (select auth.uid())
  )
  or exists (
    select 1
    from public.sub_admins sa
    join public.passenger_assistant pa on pa.company_id = sa.company_id and pa.id = target_user_id
    where sa.id = (select auth.uid())
  );
$$;

alter function public.admin_can_message_user(uuid) owner to postgres;

grant execute on function public.admin_can_message_user(uuid) to authenticated;
grant execute on function public.admin_can_message_user(uuid) to service_role;

grant select, insert on table public.admin_driver_messages to authenticated;
grant select, insert, update on table public.user_notifications to authenticated;

create or replace function public.insert_user_notification_admin(
  p_user_id uuid,
  p_company_id uuid,
  p_notification_type text,
  p_title text,
  p_body text,
  p_payload jsonb default '{}'::jsonb,
  p_reference_id uuid default null
)
returns public.user_notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_notifications;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated';
  end if;

  if not public.admin_can_message_user(p_user_id) then
    raise exception 'not authorized to notify this user';
  end if;

  insert into public.user_notifications (
    user_id,
    company_id,
    notification_type,
    title,
    body,
    payload,
    reference_id
  )
  values (
    p_user_id,
    p_company_id,
    p_notification_type,
    p_title,
    p_body,
    coalesce(p_payload, '{}'::jsonb),
    p_reference_id
  )
  returning * into v_row;

  return v_row;
end;
$$;

alter function public.insert_user_notification_admin(
  uuid, uuid, text, text, text, jsonb, uuid
) owner to postgres;

grant execute on function public.insert_user_notification_admin(
  uuid, uuid, text, text, text, jsonb, uuid
) to authenticated;

grant execute on function public.insert_user_notification_admin(
  uuid, uuid, text, text, text, jsonb, uuid
) to service_role;

-- ── Row level security ──────────────────────────────────────────────────────

alter table public.admin_driver_messages enable row level security;
alter table public.user_notifications enable row level security;

create policy "Admins send messages to company drivers"
  on public.admin_driver_messages
  for insert
  to authenticated
  with check (public.admin_can_message_user(driver_id));

create policy "Admins read company driver messages"
  on public.admin_driver_messages
  for select
  to authenticated
  using (public.admin_can_message_user(driver_id));

create policy "Drivers read own messages"
  on public.admin_driver_messages
  for select
  to authenticated
  using (auth.uid() = driver_id);

create policy "Admins insert notifications for company users"
  on public.user_notifications
  for insert
  to authenticated
  with check (public.admin_can_message_user(user_id));

create policy "Users read own notifications"
  on public.user_notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users mark own notifications read"
  on public.user_notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Realtime (self-hosted: run after tables exist) ────────────────────────────

alter table public.user_notifications replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.user_notifications;
exception
  when duplicate_object then null;
end $$;
