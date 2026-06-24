-- Admin → passenger assistant messages (run in Supabase SQL Editor).

create table if not exists public.admin_pa_messages (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies (id) on delete cascade,
  pa_id           uuid not null references public.passenger_assistant (id) on delete cascade,
  sender_admin_id uuid not null references auth.users (id) on delete cascade,
  message         text not null check (char_length(trim(message)) > 0),
  created_at      timestamptz not null default now()
);

create index if not exists idx_admin_pa_messages_pa_created
  on public.admin_pa_messages using btree (pa_id, created_at desc);

create index if not exists idx_admin_pa_messages_company
  on public.admin_pa_messages using btree (company_id);

alter table public.admin_pa_messages enable row level security;

grant select, insert on table public.admin_pa_messages to authenticated;

drop policy if exists "Admins send messages to company PAs" on public.admin_pa_messages;
drop policy if exists "Admins read company PA messages" on public.admin_pa_messages;
drop policy if exists "PAs read own messages" on public.admin_pa_messages;

create policy "Admins send messages to company PAs"
  on public.admin_pa_messages
  for insert
  to authenticated
  with check (public.admin_can_message_user(pa_id));

create policy "Admins read company PA messages"
  on public.admin_pa_messages
  for select
  to authenticated
  using (public.admin_can_message_user(pa_id));

create policy "PAs read own messages"
  on public.admin_pa_messages
  for select
  to authenticated
  using (auth.uid() = pa_id);
