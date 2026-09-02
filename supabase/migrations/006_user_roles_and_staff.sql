alter type public.account_type add value if not exists 'assessor';
alter type public.account_type add value if not exists 'administrator';

do $$
begin
  create type public.app_role as enum ('provider', 'client', 'assessor', 'administrator');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null,
  assigned_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
drop policy if exists "Users can view their own role" on public.user_roles;
create policy "Users can view their own role" on public.user_roles for select using (auth.uid() = user_id);
create index if not exists user_roles_role_idx on public.user_roles(role);

insert into public.user_roles (user_id, role)
select id, case when account_type::text = 'provider' then 'provider'::public.app_role else 'client'::public.app_role end
from public.profiles
on conflict (user_id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'account_type';
  assigned_role public.app_role := case when requested_role = 'provider' then 'provider'::public.app_role else 'client'::public.app_role end;
begin
  insert into public.profiles (id, email, full_name, account_type)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, 'Dezhub user'), '@', 1)),
    assigned_role::text::public.account_type
  )
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, updated_at = now();
  insert into public.user_roles (user_id, role) values (new.id, assigned_role) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
