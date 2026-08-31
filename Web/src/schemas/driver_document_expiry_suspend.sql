-- Suspend approved drivers when their own driver_documents expire.
-- Run in Supabase SQL Editor (safe to re-run).
-- Reminder windows (30d, 14d, …) stay on document_expiry_notifications_sent / documentExpiryScheduler.

-- ── Dedup: one suspend pass per driver document per expiry date ───────────────

create table if not exists public.driver_document_expiry_suspend_processed (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null,
  driver_id     uuid not null references public.drivers (id) on delete cascade,
  company_id    uuid null references public.companies (id) on delete cascade,
  expiry_date   date not null,
  processed_at  timestamptz not null default now(),
  constraint uq_driver_document_expiry_suspend unique (document_id, expiry_date)
);

create index if not exists idx_driver_doc_expiry_suspend_driver
  on public.driver_document_expiry_suspend_processed using btree (driver_id, processed_at desc);

create index if not exists idx_driver_doc_expiry_suspend_company
  on public.driver_document_expiry_suspend_processed using btree (company_id, processed_at desc);

grant select, insert, delete on table public.driver_document_expiry_suspend_processed to service_role;
grant select on table public.driver_document_expiry_suspend_processed to authenticated;

alter table public.driver_document_expiry_suspend_processed enable row level security;

drop policy if exists "Portal users read company driver document expiry suspend processed"
  on public.driver_document_expiry_suspend_processed;

create policy "Portal users read company driver document expiry suspend processed"
  on public.driver_document_expiry_suspend_processed
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.company_admins ca
      where ca.id = (select auth.uid())
        and ca.company_id = driver_document_expiry_suspend_processed.company_id
    )
    or exists (
      select 1
      from public.sub_admins sa
      where sa.id = (select auth.uid())
        and sa.company_id = driver_document_expiry_suspend_processed.company_id
    )
  );
