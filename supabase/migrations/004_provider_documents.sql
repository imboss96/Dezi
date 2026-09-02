create type public.document_status as enum ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null,
  file_name text not null,
  storage_path text not null unique,
  status public.document_status not null default 'PENDING',
  reviewer_notes text,
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents enable row level security;
create policy "Providers can view their own document records" on public.documents for select using (auth.uid() = provider_id);
create policy "Providers can create their own document records" on public.documents for insert with check (auth.uid() = provider_id);
create policy "Private provider document bucket" on storage.objects for select using (bucket_id = 'provider-documents' and (auth.uid()::text = (storage.foldername(name))[1]));
create policy "Providers can upload their own documents" on storage.objects for insert with check (bucket_id = 'provider-documents' and (auth.uid()::text = (storage.foldername(name))[1]));

insert into storage.buckets (id, name, public) values ('provider-documents', 'provider-documents', false) on conflict (id) do nothing;
create index documents_provider_id_idx on public.documents(provider_id);
create index documents_status_idx on public.documents(status);
