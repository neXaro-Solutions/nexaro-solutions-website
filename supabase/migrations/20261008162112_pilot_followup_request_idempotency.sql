-- Safe re-submission of existing Pilot follow-up actions after network failure.
-- A nullable UUID preserves legacy actions and non-client-originated workflow steps.
alter table public.actions add column if not exists pilot_request_id uuid;
create unique index if not exists pilot_actions_request_once
  on public.actions (pilot_request_id)
  where pilot_request_id is not null;
comment on column public.actions.pilot_request_id
  is 'One-time client request UUID for safely retrying a follow-up action; null on legacy and system-created tasks.';
