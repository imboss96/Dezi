create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'account_type';
begin
  insert into public.profiles (id, email, full_name, account_type)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, 'Dezhub user'), '@', 1)),
    case when requested_role = 'provider' then 'provider'::public.account_type else 'client'::public.account_type end
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    account_type = excluded.account_type,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

revoke all on function public.handle_new_user() from public;
