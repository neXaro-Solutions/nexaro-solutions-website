-- Keep durable status consistent if an Edge worker exceeds its lease or authorization expires.
create or replace function public.pilot_background_reap()
returns integer language plpgsql security definer set search_path = ''
as $fn$
declare total integer;
declare expired integer;
begin
  update public.pilot_background_jobs
     set status='waiting_user',stage='waiting_user',
         handoff_reason='EXECUTION_LEASE_EXPIRED_REVIEW_REQUIRED',
         last_error='EXECUTION_LEASE_EXPIRED_REVIEW_REQUIRED',
         lease_token=null,lease_until=null,
         stage_updated_at=now(),updated_at=now()
   where status='running' and lease_until<now();
  get diagnostics total=row_count;
  update public.pilot_background_jobs
     set status='completed',stage='completed',
         handoff_reason=null,last_error='BACKGROUND_AUTHORIZATION_EXPIRED',
         lease_token=null,lease_until=null,
         stage_updated_at=now(),updated_at=now()
   where status='queued' and expires_at<=now();
  get diagnostics expired=row_count;
  return total+expired;
end;
$fn$;
revoke all on function public.pilot_background_reap() from public, anon, authenticated;
grant execute on function public.pilot_background_reap() to service_role;
