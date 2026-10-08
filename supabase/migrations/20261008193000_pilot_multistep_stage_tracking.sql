-- Multi-step creative work: durable, owner-readable stage tracking.
-- Keep authorization, ownership, step caps, cost reservation and cron unchanged.
alter table public.pilot_background_jobs
 add column if not exists stage text not null default 'queued'
 check(stage in ('queued','preparing','drafting','verifying','saving','waiting_user','completed','paused'));
alter table public.pilot_background_jobs
 add column if not exists current_action_id uuid references public.actions(id) on delete set null;
alter table public.pilot_background_jobs
 add column if not exists current_action_title text;
alter table public.pilot_background_jobs
 add column if not exists stage_updated_at timestamptz not null default now();
alter table public.pilot_background_jobs
 add column if not exists handoff_reason text;
comment on column public.pilot_background_jobs.stage is 'Observed server-stage only; completion requires saved verified project result.';
comment on column public.pilot_background_jobs.handoff_reason is 'Reason for human handoff; never a grant of authorization.';
