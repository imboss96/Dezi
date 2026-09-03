alter table public.profiles
  add column if not exists rate_amount numeric(12, 2),
  add column if not exists rate_period text check (rate_period in ('hour', 'day', 'month'));

create index if not exists profiles_rate_period_idx on public.profiles(rate_period);

notify pgrst, 'reload schema';