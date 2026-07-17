-- Force an Auth user back to "Waiting for verification" after a temporary
-- registration session is minted. Callable only with the service role.
--
-- Run once in Supabase SQL editor (or via docker exec into supabase-db).

create or replace function public.force_unconfirm_auth_user(target_user uuid)
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  if target_user is null then
    raise exception 'target_user is required';
  end if;

  -- confirmed_at is typically generated from email_confirmed_at; clear email only.
  update auth.users
  set email_confirmed_at = null
  where id = target_user;
end;
$$;

revoke all on function public.force_unconfirm_auth_user(uuid) from public;
grant execute on function public.force_unconfirm_auth_user(uuid) to service_role;
