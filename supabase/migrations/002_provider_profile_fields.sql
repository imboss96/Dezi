alter table public.profiles
  add column if not exists emergency_contact text,
  add column if not exists professional_category text,
  add column if not exists availability text,
  add column if not exists salary_expectation text,
  add column if not exists languages text,
  add column if not exists experience_years integer check (experience_years >= 0 and experience_years <= 60),
  add column if not exists "references" text;
