-- Opt-in device subscriptions, private signing keys, and a leased delivery outbox.
create table public.pilot_push_config(id integer primary key check(id=1),public_key text not null,private_key text not null);
alter table public.pilot_push_config enable row level security;
revoke all on public.pilot_push_config from public,anon,authenticated;
grant all on public.pilot_push_config to service_role;
create table public.pilot_push_subscriptions(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,
 endpoint_hash text not null,subscription jsonb not null,updated_at timestamptz not null default now(),unique(owner_id,endpoint_hash)
);
alter table public.pilot_push_subscriptions enable row level security;
revoke all on public.pilot_push_subscriptions from public,anon,authenticated;
grant all on public.pilot_push_subscriptions to service_role;
create table public.pilot_push_events(
 id uuid primary key default gen_random_uuid(),goal_id uuid not null references public.goals(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,kind text not null,title text not null,body text not null,
 state text not null default 'pending' check(state in ('pending','sending','sent','failed','cancelled')),
 attempts integer not null default 0,lease_token uuid,lease_until timestamptz,next_attempt_at timestamptz not null default now(),
 created_at timestamptz not null default now(),sent_at timestamptz,unique(goal_id,kind)
);
alter table public.pilot_push_events enable row level security;
revoke all on public.pilot_push_events from public,anon,authenticated;
grant all on public.pilot_push_events to service_role;
create index pilot_push_pending on public.pilot_push_events(next_attempt_at) where state in ('pending','sending');
create function pilot_internal.enqueue_push() returns trigger language plpgsql security definer set search_path='' as $$
declare gid uuid; uid uuid; k text; t text; b text;
begin
 if tg_op='UPDATE' and new.status is not distinct from old.status then return new; end if;
 if tg_table_name='goals' then
  if new.status<>'achieved' then return new; end if;
  gid:=new.id; k:='result';t:='Pilot: Dein Ergebnis ist fertig';b:='Dein Auftrag ist abgeschlossen. Öffne Pilot, um das Ergebnis anzusehen.';
 else
  gid:=new.goal_id;
  if new.status in ('waiting_user','waiting_approval','review_required','blocked','failed') then
   k:='attention';t:='Pilot benötigt deine Entscheidung';b:='Dein Auftrag ist gespeichert. Öffne Pilot für den nächsten notwendigen Schritt.';
  elsif tg_table_name='pilot_background_jobs' and new.status='completed' then
   if exists(select 1 from public.actions where goal_id=gid and status<>'completed') then return new; end if;
   if not exists(select 1 from public.results where goal_id=gid and status='final' and quality_status='ready') then return new; end if;
   if exists(select 1 from public.goals where id=gid and coalesce(description,'') ~* '(logo|bild|grafik|präsentation|powerpoint|homepage|website|webseite)') then return new; end if;
   k:='result';t:='Pilot: Dein Text ist fertig';b:='Dein fertiger Text liegt im Auftrag bereit. Öffne Pilot, um ihn anzusehen.';
  else return new; end if;
 end if;
 select owner_id into uid from public.goals where id=gid;
 if uid is null or not exists(select 1 from public.pilot_push_subscriptions where owner_id=uid) then return new; end if;
 -- Goal-level coalescing prevents duplicated notifications from job + execution transitions.
 insert into public.pilot_push_events(goal_id,owner_id,kind,title,body) values(gid,uid,k,t,b)
 on conflict(goal_id,kind) do update set state='pending',attempts=0,title=excluded.title,body=excluded.body,
 next_attempt_at=now(),created_at=now(),lease_token=null,lease_until=null,sent_at=null
 where public.pilot_push_events.state not in ('pending','sending');
 return new;
end;$$;
revoke all on function pilot_internal.enqueue_push() from public,anon,authenticated;
create trigger pilot_goal_push after update of status on public.goals for each row execute function pilot_internal.enqueue_push();
create trigger pilot_background_push after insert or update of status on public.pilot_background_jobs for each row execute function pilot_internal.enqueue_push();
create trigger pilot_execution_push after insert or update of status on public.executions for each row execute function pilot_internal.enqueue_push();
create function public.pilot_push_claim() returns setof public.pilot_push_events language plpgsql security definer set search_path='' as $$
begin
 return query with candidate as (
 select id from public.pilot_push_events where attempts<3 and created_at>now()-interval '24 hours' and
 ((state='pending' and next_attempt_at<=now()) or (state='sending' and lease_until<now()))
 order by created_at for update skip locked limit 10
 ) update public.pilot_push_events e set state='sending',lease_token=gen_random_uuid(),lease_until=now()+interval '5 minutes',attempts=attempts+1
 from candidate where e.id=candidate.id returning e.*;
end;$$;
revoke all on function public.pilot_push_claim() from public,anon,authenticated;
grant execute on function public.pilot_push_claim() to service_role;
select cron.schedule('pilot-push-dispatch','* * * * *',$cron$
 select net.http_post(
 url:='https://qfrylqxbqmuafyvnqkey.supabase.co/functions/v1/pilot-push',
 headers:=jsonb_build_object('Content-Type','application/json','x-pilot-worker-key',(select secret from pilot_internal.worker_credentials where name='pilot_background')),
 body:='{"operation":"dispatch"}'::jsonb,timeout_milliseconds:=120000
 );
$cron$);
