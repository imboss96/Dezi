do $$
begin
  create type public.audit_action as enum ('STAFF_INVITED', 'ROLE_ASSIGNED');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action public.audit_action not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;
create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index if not exists audit_logs_target_user_id_idx on public.audit_logs(target_user_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
