-- Durable append-only decisions. Newer entries supersede older without rewriting history.
create table if not exists public.pilot_decision_journal (
 id bigint generated always as identity primary key,
 goal_id uuid not null references public.goals(id) on delete cascade,
 organization_id uuid not null references public.organizations(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 decision_key text not null check (decision_key in ('legal_form','company_name','industry','budget','brand_style')),
 decision_value text not null check (char_length(decision_value)<=500),
 event_type text not null check (event_type in ('set','revoke')),
 source_type text not null check (source_type in ('direct_user','user_confirmed_review','user_answer')),
 source_ref text,
 created_at timestamptz not null default now(),
 constraint pilot_decision_journal_value_check
   check ((event_type='revoke' and decision_value='') or (event_type='set' and char_length(btrim(decision_value))>0))
);
create index if not exists pilot_decision_journal_lookup
 on public.pilot_decision_journal (goal_id,decision_key,id desc);
create unique index if not exists pilot_decision_journal_source_once
 on public.pilot_decision_journal (goal_id,decision_key,source_ref)
 where source_ref is not null;
alter table public.pilot_decision_journal enable row level security;
drop policy if exists pilot_decision_journal_owner_select on public.pilot_decision_journal;
create policy pilot_decision_journal_owner_select on public.pilot_decision_journal
 for select to authenticated using (
   owner_id=(select auth.uid()) and exists (
     select 1 from public.goals g where g.id=goal_id and
     g.owner_id=(select auth.uid()) and g.organization_id=organization_id
   )
 );
drop policy if exists pilot_decision_journal_owner_insert on public.pilot_decision_journal;
create policy pilot_decision_journal_owner_insert on public.pilot_decision_journal
 for insert to authenticated with check (
   owner_id=(select auth.uid()) and source_type='direct_user' and exists (
     select 1 from public.goals g where g.id=goal_id and
     g.owner_id=(select auth.uid()) and g.organization_id=organization_id
   )
 );
revoke all on public.pilot_decision_journal from anon;
grant select,insert on public.pilot_decision_journal to authenticated;
grant usage,select on sequence public.pilot_decision_journal_id_seq to authenticated;
-- Intentionally no UPDATE/DELETE policy: prior user decisions remain reviewable.
