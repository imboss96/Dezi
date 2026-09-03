alter table public.profiles
  add column if not exists availability text;

notify pgrst, 'reload schema';
