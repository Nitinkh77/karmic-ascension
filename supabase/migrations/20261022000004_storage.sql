-- ============================================================================
-- Storage: public-read 'site-media' bucket, admin-only writes.
-- SVG is intentionally NOT allowed for uploads (script-injection risk).
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets serve files by URL without a SELECT policy.
-- Only admins may list, upload, replace or delete objects through the API.
create policy "site_media_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'site-media' and (select public.is_admin()));

create policy "site_media_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'site-media' and (select public.is_admin()));

create policy "site_media_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'site-media' and (select public.is_admin()))
  with check (bucket_id = 'site-media' and (select public.is_admin()));

create policy "site_media_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'site-media' and (select public.is_admin()));
