alter table public.documents add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.documents add column if not exists reviewed_at timestamptz;

alter type public.audit_action add value if not exists 'DOCUMENT_VERIFIED';

create index if not exists documents_reviewed_by_idx on public.documents(reviewed_by);