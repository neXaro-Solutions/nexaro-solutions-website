-- Background autonomy is not considered verified until an administrator
-- starts and observes one real, cost-bounded, isolated cron-driven run.
insert into public.alpha_readiness_checks
  (check_key,category,description,required,status,evidence,updated_at)
values
  ('private_alpha_background_e2e','execution',
   'Echter Hintergrundtest: Serverausführung, Projektergebnis, Verifikation und sichere Testbereinigung',
   true,'ready_for_verify',
   '{"scope":"scheduled_background_worker","reason":"live_admin_test_not_yet_executed"}'::jsonb,now())
on conflict (check_key) do nothing;
