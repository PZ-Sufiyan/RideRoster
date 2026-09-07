-- Soft-delete for driver / PA self-service account close.
-- Run in Supabase SQL Editor (safe to re-run).
-- Deleted staff keep profile + history. Auth email is freed by the push-api.
-- Unique email only among non-deleted rows so they can register again later.

-- ── Unique email among active staff only ─────────────────────────────────────

drop index if exists public.uq_drivers_email;
drop index if exists public.uq_drivers_email_active;
create unique index if not exists uq_drivers_email_active
  on public.drivers (lower(email))
  where lower(coalesce(status, '')) is distinct from 'deleted';

drop index if exists public.uq_passenger_assistant_email;
drop index if exists public.uq_passenger_assistant_email_active;
create unique index if not exists uq_passenger_assistant_email_active
  on public.passenger_assistant (lower(email))
  where lower(coalesce(status, '')) is distinct from 'deleted';

-- ── Private vehicles of deleted drivers: inactive (hidden from fleet lists) ──

alter table public.vehicles drop constraint if exists vehicles_status_check;
alter table public.vehicles
  add constraint vehicles_status_check check (status in ('active', 'off_road', 'inactive'));

-- ── Portal event types ───────────────────────────────────────────────────────

alter table public.driver_event_notifications
  drop constraint if exists driver_event_notifications_event_type_check;
alter table public.driver_event_notifications
  add constraint driver_event_notifications_event_type_check check (
    event_type in (
      'driver_document_expired',
      'driver_suspended',
      'driver_approved',
      'driver_rejected',
      'driver_active',
      'driver_deleted'
    )
  );

alter table public.pa_event_notifications
  drop constraint if exists pa_event_notifications_event_type_check;
alter table public.pa_event_notifications
  add constraint pa_event_notifications_event_type_check check (
    event_type in (
      'pa_document_expired',
      'pa_suspended',
      'pa_approved',
      'pa_rejected',
      'pa_removed_from_job',
      'pa_deleted'
    )
  );

-- ── Job reassignment reason when a driver deletes their account ──────────────

alter table public.job_reassignment_alerts
  drop constraint if exists job_reassignment_alerts_reason_check;
alter table public.job_reassignment_alerts
  add constraint job_reassignment_alerts_reason_check check (
    reason in (
      'company_vehicle_document_expiry',
      'company_driver_document_expiry',
      'private_vehicle_document_expiry',
      'private_driver_document_expiry',
      'driver_account_deleted'
    )
  );
