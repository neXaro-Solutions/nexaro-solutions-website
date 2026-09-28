-- Invitation access only through the service-side Edge Function.
create table public.nx_demo_invitations (
 id uuid primary key default gen_random_uuid(),
 label text not null,
 code_hash text not null unique check (code_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 check (expires_at > created_at)
);
create table public.nx_demo_content (id text primary key, html text not null, updated_at timestamptz not null default now());
create table public.nx_demo_limits (key text primary key, bucket timestamptz not null, attempts integer not null default 0);
alter table public.nx_demo_invitations enable row level security;
alter table public.nx_demo_content enable row level security;
alter table public.nx_demo_limits enable row level security;
revoke all on public.nx_demo_invitations, public.nx_demo_content, public.nx_demo_limits from public, anon, authenticated;
grant all on public.nx_demo_invitations, public.nx_demo_content, public.nx_demo_limits to service_role;
create or replace function public.nx_demo_rate_limit(p_key text) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare n integer; current_bucket timestamptz := date_trunc('minute', clock_timestamp());
begin
 delete from public.nx_demo_limits where bucket < current_bucket - interval '1 day';
 insert into public.nx_demo_limits as l(key,bucket,attempts) values(p_key,current_bucket,1)
 on conflict(key) do update set bucket=current_bucket, attempts=case when l.bucket=current_bucket then l.attempts+1 else 1 end
 returning attempts into n;
 return n<=30;
end; $$;
revoke all on function public.nx_demo_rate_limit(text) from public, anon, authenticated;
grant execute on function public.nx_demo_rate_limit(text) to service_role;
