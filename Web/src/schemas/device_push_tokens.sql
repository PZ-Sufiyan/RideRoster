-- Stores FCM device tokens for push notifications (drivers, PAs, etc.)
-- Run this in your self-hosted Supabase SQL editor (Studio) before enabling push.

create table if not exists public.device_push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  fcm_token   text not null,
  platform    text not null check (platform in ('android', 'ios')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint device_push_tokens_user_token_key unique (user_id, fcm_token)
);

create index if not exists idx_device_push_tokens_user
  on public.device_push_tokens using btree (user_id);

alter table public.device_push_tokens enable row level security;

-- Drivers manage only their own tokens from the mobile app.
create policy "Users manage own push tokens"
  on public.device_push_tokens
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
