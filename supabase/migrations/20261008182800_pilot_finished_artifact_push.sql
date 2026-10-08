create or replace function pilot_internal.enqueue_push() returns trigger language plpgsql security definer set search_path='' as $$
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
  elsif tg_table_name in ('pilot_background_jobs','executions') and new.status='completed' then
   if exists(select 1 from public.actions where goal_id=gid and status<>'completed') then return new; end if;
   if not exists(select 1 from public.results where goal_id=gid and status='final' and quality_status='ready') then return new; end if;
   if exists(select 1 from public.goals g cross join (values ('image','(logo|bild|grafik|illustration)'),('presentation','(präsentation|praesentation|powerpoint)'),('website','(homepage|website|webseite)')) wanted(kind,pattern)
     where g.id=gid and coalesce(g.description,g.title,'') ~* wanted.pattern and not exists(
       select 1 from public.results r cross join lateral jsonb_array_elements(coalesce(r.structured_content->'deliverables','[]'::jsonb)) d
       where r.goal_id=gid and r.status='final' and r.quality_status='ready' and d->>'kind'=wanted.kind and d->>'verified'='true' and d->>'storage_path' is not null)) then return new; end if;
   k:='result';t:='Pilot: Dein Ergebnis ist fertig';b:='Dein fertiges Ergebnis liegt im Auftrag bereit. Öffne Pilot, um es anzusehen.';
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
