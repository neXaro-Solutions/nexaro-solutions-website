-- Pilot: authorization-scoped durable background processing.
-- All secrets are generated inside Postgres and never appear in migration text.
create extension if not exists pg_cron with schema pg_catalog;
create schema if not exists pilot_internal;
revoke all on schema pilot_internal from public, anon, authenticated;
create table if not exists pilot_internal.worker_credentials (
  name text primary key,
  secret text not null
);
revoke all on pilot_internal.worker_credentials from public, anon, authenticated;
insert into pilot_internal.worker_credentials(name,secret)
values ('pilot_background',encode(gen_random_bytes(32),'hex'))
on conflict (name) do nothing;

create table if not exists public.pilot_background_jobs (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null unique references public.goals(id) on delete cascade,
  organization_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued'
    check(status in ('queued','running','waiting_user','completed','paused','failed')),
  max_steps integer not null default 6 check(max_steps between 1 and 12),
  steps_completed integer not null default 0 check(steps_completed between 0 and 12),
  max_cost_usd numeric(10,5) not null default 0.25 check(max_cost_usd between 0 and 0.50),
  cost_spent_usd numeric(10,5) not null default 0 check(cost_spent_usd >= 0),
  lease_token uuid,
  lease_until timestamptz,
  next_run_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  last_error text,
  last_result_id uuid,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pilot_bg_bounded_expires check(expires_at <= started_at + interval '24 hours')
);
create index if not exists pilot_bg_queue_idx
on public.pilot_background_jobs (next_run_at,updated_at)
where status='queued';
alter table public.pilot_background_jobs enable row level security;
revoke all on public.pilot_background_jobs from anon, authenticated;
grant select on public.pilot_background_jobs to authenticated;
grant all on public.pilot_background_jobs to service_role;
drop policy if exists pilot_bg_owner_read on public.pilot_background_jobs;
create policy pilot_bg_owner_read on public.pilot_background_jobs
 for select to authenticated
 using (owner_id=(select auth.uid()) and exists (
   select 1 from public.goals g where g.id=goal_id
   and g.owner_id=(select auth.uid()) and g.organization_id=organization_id
 ));

-- Only the server role can verify the private random wake-up token.
create or replace function public.pilot_background_verify_token(provided text)
returns boolean language sql security definer
set search_path = ''
as $$
  select length(coalesce(provided,''))=64
    and exists(select 1 from pilot_internal.worker_credentials
      where name='pilot_background' and
      encode(extensions.digest(secret,'sha256'),'hex') =
      encode(extensions.digest(provided,'sha256'),'hex'));
$$;
revoke all on function public.pilot_background_verify_token(text) from public, anon, authenticated;
grant execute on function public.pilot_background_verify_token(text) to service_role;

-- Claiming is atomic across concurrent scheduler invocations, browser wakeups and retries.
create or replace function public.pilot_background_claim()
returns setof public.pilot_background_jobs
language plpgsql security definer set search_path = ''
as $$
begin
  return query
  with candidate as (
    select j.id from public.pilot_background_jobs j
    where j.status='queued'
      and j.next_run_at <= now()
      and j.expires_at > now()
      and j.steps_completed < j.max_steps
      and j.cost_spent_usd < j.max_cost_usd
    order by j.next_run_at,j.started_at,j.id
    for update skip locked limit 1
  )
  update public.pilot_background_jobs j
  set status='running',lease_token=gen_random_uuid(),
      lease_until=now()+interval '90 seconds',updated_at=now()
  from candidate where candidate.id=j.id
  returning j.*;
end;
$$;
revoke all on function public.pilot_background_claim() from public, anon, authenticated;
grant execute on function public.pilot_background_claim() to service_role;

-- A crashed function may only be retried when its lease expired. An incomplete
-- AI call may have been billed; never blindly rerun it without accounting.
create or replace function public.pilot_background_reap()
returns integer language plpgsql security definer set search_path = ''
as $$
declare total integer;
begin
  update public.pilot_background_jobs
  set status='waiting_user',last_error='EXECUTION_LEASE_EXPIRED_REVIEW_REQUIRED',
      lease_token=null,lease_until=null,updated_at=now()
  where status='running' and lease_until<now();
  get diagnostics total = row_count;
  return total;
end;
$$;
revoke all on function public.pilot_background_reap() from public, anon, authenticated;
grant execute on function public.pilot_background_reap() to service_role;

-- A scheduler job stores a SELECT of the secret, never the secret itself.
select cron.schedule(
  'pilot-background-dispatch', '* * * * *',
  $cron$
  select net.http_post(
    url:='https://qfrylqxbqmuafyvnqkey.supabase.co/functions/v1/pilot-background',
    headers:=jsonb_build_object(
      'content-type','application/json',
      'x-pilot-worker-key',(select secret from pilot_internal.worker_credentials
        where name='pilot_background')),
    body:='{"operation":"tick"}'::jsonb,
    timeout_milliseconds:=12000
  );
  $cron$
);
