create table if not exists public.academy_courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists public.academy_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.academy_courses(id) on delete cascade,
  progress integer not null default 0 check (progress between 0 and 100),
  status text not null default 'IN_PROGRESS',
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'NOT_STARTED',
  score numeric,
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null,
  description text,
  required_category text,
  status text not null default 'OPEN',
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  provider_id uuid not null references auth.users(id) on delete cascade,
  match_score integer check (match_score between 0 and 100),
  status text not null default 'RECOMMENDED',
  created_at timestamptz not null default now(),
  unique (opportunity_id, provider_id)
);

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.opportunities(id) on delete set null,
  provider_id uuid not null references auth.users(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'SCHEDULED',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.academy_courses(id) on delete set null,
  title text not null,
  issued_at timestamptz,
  certificate_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.placements (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.opportunities(id) on delete set null,
  provider_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'PENDING',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.academy_courses enable row level security;
alter table public.academy_enrollments enable row level security;
alter table public.assessments enable row level security;
alter table public.opportunities enable row level security;
alter table public.matches enable row level security;
alter table public.interviews enable row level security;
alter table public.certificates enable row level security;
alter table public.placements enable row level security;
alter table public.notifications enable row level security;

create policy "Users can view academy courses" on public.academy_courses for select using (true);
create policy "Users can view own academy enrollments" on public.academy_enrollments for select using (auth.uid() = user_id);
create policy "Users can view own assessments" on public.assessments for select using (auth.uid() = user_id);
create policy "Users can view open opportunities" on public.opportunities for select using (status = 'OPEN');
create policy "Providers can view own matches" on public.matches for select using (auth.uid() = provider_id);
create policy "Providers can view own interviews" on public.interviews for select using (auth.uid() = provider_id);
create policy "Users can view own certificates" on public.certificates for select using (auth.uid() = user_id);
create policy "Providers can view own placements" on public.placements for select using (auth.uid() = provider_id);
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);

create index if not exists matches_provider_id_idx on public.matches(provider_id);
create index if not exists interviews_provider_id_idx on public.interviews(provider_id);
create index if not exists notifications_user_id_created_at_idx on public.notifications(user_id, created_at desc);
