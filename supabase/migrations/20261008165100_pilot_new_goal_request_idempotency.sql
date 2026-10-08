-- First-time projects need the same retry guarantee as follow-up actions.
-- The digest ties a client request UUID to its exact initial command, without
-- storing an additional plaintext copy of potentially sensitive instructions.
alter table public.goals
  add column if not exists pilot_request_id uuid,
  add column if not exists pilot_request_fingerprint text;

create unique index if not exists pilot_goals_request_once
  on public.goals(pilot_request_id)
  where pilot_request_id is not null;

alter table public.goals
  add constraint pilot_goal_request_pair_consistent
  check (
    (pilot_request_id is null and pilot_request_fingerprint is null)
    or
    (pilot_request_id is not null and
     pilot_request_fingerprint ~ '^[0-9a-f]{64}$')
  );

comment on column public.goals.pilot_request_id
  is 'Unique client request UUID for safe initial-project retries; null for legacy or system-created goals.';
comment on column public.goals.pilot_request_fingerprint
  is 'SHA-256 hex digest of the exact initial user instruction for verifying retry identity.';
