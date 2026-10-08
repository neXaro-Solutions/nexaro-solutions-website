-- Expire queued authorizations on the server even if the phone never reconnects.
create or replace function public.pilot_background_reap()
returns integer language plpgsql security definer set search_path = ''
as $fn$
declare total integer;
declare expired integer;
begin
  update public.pilot_background_jobs
  set status='waiting_user',last_error='EXECUTION_LEASE_EXPIRED_REVIEW_REQUIRED',
      lease_token=null,lease_until=null,updated_at=now()
  where status='running' and lease_until < now();
  get diagnostics total = row_count;
  update public.pilot_background_jobs
  set status='completed',last_error='BACKGROUND_AUTHORIZATION_EXPIRED',
      lease_token=null,lease_until=null,updated_at=now()
  where status='queued' and expires_at <= now();
  get diagnostics expired = row_count;
  return total + expired;
end;
$fn$;
revoke all on function public.pilot_background_reap() from public, anon, authenticated;
grant execute on function public.pilot_background_reap() to service_role;