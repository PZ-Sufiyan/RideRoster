-- Document expiry notifications for drivers and passenger assistants.
-- Run in Supabase SQL Editor (safe to re-run).

-- ── Allow document_expiry in user_notifications ───────────────────────────────

alter table public.user_notifications
  drop constraint if exists user_notifications_notification_type_check;

alter table public.user_notifications
  add constraint user_notifications_notification_type_check
  check (
    notification_type in (
      'message',
      'leave_status',
      'job_assignment',
      'document_expiry'
    )
  );

-- ── Dedup table: one notice per document per reminder window ──────────────────

create table if not exists public.document_expiry_notifications_sent (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null,
  document_source text not null check (
    document_source in ('driver', 'vehicle', 'passenger_assistant')
  ),
  user_id         uuid not null references auth.users (id) on delete cascade,
  reminder_type   text not null check (
    reminder_type in ('30d', '14d', '7d', '48h', '24h')
  ),
  sent_at         timestamptz not null default now(),
  constraint uq_document_expiry_notification unique (
    document_id,
    document_source,
    reminder_type
  )
);

create index if not exists idx_document_expiry_sent_user
  on public.document_expiry_notifications_sent using btree (user_id, sent_at desc);

create index if not exists idx_document_expiry_sent_reminder
  on public.document_expiry_notifications_sent using btree (reminder_type, sent_at desc);

grant select, insert on table public.document_expiry_notifications_sent to service_role;
