-- Fix: "new row violates row-level security policy for table user_notifications"
-- Run this in Supabase SQL Editor on your VPS (safe to re-run).

-- ── Helper: resolve caller id reliably on self-hosted Supabase ────────────────

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

-- ── Table grants ──────────────────────────────────────────────────────────────

grant select, insert on table public.admin_driver_messages to authenticated;
grant select, insert, update on table public.user_notifications to authenticated;

-- ── SECURITY DEFINER RPC — bypasses RLS for admin notification inserts ────────

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

-- ── Recreate insert policy (fallback for direct inserts) ──────────────────────

drop policy if exists "Admins insert notifications for company users" on public.user_notifications;

create policy "Admins insert notifications for company users"
  on public.user_notifications
  for insert
  to authenticated
  with check (public.admin_can_message_user(user_id));

alter table public.user_notifications enable row level security;
alter table public.admin_driver_messages enable row level security;
