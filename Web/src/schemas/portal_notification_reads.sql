-- Persists read/unread state for admin & sub-admin portal notifications.
-- Read state is per auth user AND viewer role (admin vs subadmin are independent).

create table if not exists public.portal_notification_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  viewer_role text not null check (viewer_role in ('admin', 'subadmin')),
  notification_key text not null,
  read_at timestamptz not null default now(),
  constraint portal_notification_reads_unique unique (user_id, viewer_role, notification_key)
);

create index if not exists idx_portal_notification_reads_user_role
  on public.portal_notification_reads using btree (user_id, viewer_role);

alter table public.portal_notification_reads enable row level security;

create policy "Users read own portal notification reads"
  on public.portal_notification_reads
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own portal notification reads"
  on public.portal_notification_reads
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own portal notification reads"
  on public.portal_notification_reads
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on table public.portal_notification_reads to authenticated;
