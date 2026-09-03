with duplicates as (
  select id,
    row_number() over (
      partition by provider_id, document_type
      order by created_at desc, id desc
    ) as row_number
  from public.documents
)
delete from public.documents
where id in (select id from duplicates where row_number > 1);

create unique index if not exists documents_provider_type_unique_idx
  on public.documents(provider_id, document_type);

notify pgrst, 'reload schema';