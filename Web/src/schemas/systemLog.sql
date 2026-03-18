-- =====================================================
-- System Log Status Enum
-- =====================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'log_status') then
    create type log_status as enum ('Success', 'Failure');
  end if;
end$$;


-- =====================================================
-- System Logs Table
-- =====================================================
create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),

  -- Time of action
  timestamp timestamptz not null default now(),

  -- Optional user reference (can be null for system actions)
  user_id uuid
    references public.users(id)
    on delete set null,

  -- Store display name (avoid joins for logs UI)
  user_name text,

  -- Action performed
  action text not null,

  -- Status (Success / Failure)
  status log_status not null,

  -- IP Address (supports IPv4 & IPv6)
  ip_address inet,

  created_at timestamptz not null default now()
);


-- =====================================================
-- Indexes (IMPORTANT for performance)
-- =====================================================

-- Fast filtering by time (most common)
create index if not exists idx_system_logs_timestamp
on public.system_logs(timestamp desc);

-- Filter by user
create index if not exists idx_system_logs_user
on public.system_logs(user_id);

-- Filter by status
create index if not exists idx_system_logs_status
on public.system_logs(status);

-- Optional: search actions
create index if not exists idx_system_logs_action
on public.system_logs using gin (to_tsvector('english', action));