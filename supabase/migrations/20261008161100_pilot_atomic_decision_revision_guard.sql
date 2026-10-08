-- Enforce atomic compare-and-append for decisions, including simultaneous requests.
alter table public.pilot_decision_journal
  add column if not exists expected_revision_id bigint;
create or replace function public.pilot_decision_revision_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $func$
declare
  existing_id bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.goal_id::text || ':' || new.decision_key, 42)
  );
  select d.id into existing_id
    from public.pilot_decision_journal d
   where d.goal_id = new.goal_id and d.decision_key = new.decision_key
   order by d.id desc limit 1;
  if existing_id is distinct from new.expected_revision_id then
    raise exception 'decision_revision_conflict' using errcode = 'P0001';
  end if;
  return new;
end;
$func$;
drop trigger if exists pilot_decision_revision_guard_insert on public.pilot_decision_journal;
create trigger pilot_decision_revision_guard_insert
  before insert on public.pilot_decision_journal
  for each row execute function public.pilot_decision_revision_guard();
revoke execute on function public.pilot_decision_revision_guard() from public, anon;
comment on function public.pilot_decision_revision_guard()
 is 'Serialized append-only compare-and-set; prevents stale journal writes across devices.';
