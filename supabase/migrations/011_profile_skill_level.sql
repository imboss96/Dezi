alter table public.profiles
  add column if not exists skill_level text;

notify pgrst, 'reload schema';
