-- RLS for leave_requests so company admins/sub-admins can read driver AND
-- passenger assistant leave requests, and staff can submit their own.
-- Safe to re-run (drops/recreates policies).

alter table public.leave_requests enable row level security;

drop policy if exists "Staff read own leave requests" on public.leave_requests;
drop policy if exists "Staff insert own leave requests" on public.leave_requests;
drop policy if exists "Portal users read company staff leave requests" on public.leave_requests;
drop policy if exists "Portal users update company staff leave requests" on public.leave_requests;

create policy "Staff read own leave requests"
  on public.leave_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Staff insert own leave requests"
  on public.leave_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Reuses admin_can_message_user() — covers drivers AND passenger assistants
-- for both company_admins and sub_admins.
create policy "Portal users read company staff leave requests"
  on public.leave_requests
  for select
  to authenticated
  using (public.admin_can_message_user(user_id));

create policy "Portal users update company staff leave requests"
  on public.leave_requests
  for update
  to authenticated
  using (public.admin_can_message_user(user_id))
  with check (public.admin_can_message_user(user_id));

grant select, insert, update on table public.leave_requests to authenticated;
