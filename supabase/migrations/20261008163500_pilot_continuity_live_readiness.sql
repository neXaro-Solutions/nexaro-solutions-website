-- Do not treat the previously passed execution-only test as evidence that
-- the newly extended goal-continuity E2E suite has already been run.
insert into public.alpha_readiness_checks
  (check_key,category,description,required,status,evidence,updated_at)
values (
  'private_alpha_continuity_e2e','execution',
  'Live-E2E: bestätigte Entscheidungen, Projektfortsetzung, Retry, Konflikt und sauberes Aufräumen',
  true,'ready_for_verify',
  '{"scope":"continuity_and_retry","reason":"extended_live_e2e_not_yet_executed"}'::jsonb,
  now()
)
on conflict (check_key) do nothing;