-- Creates the storage bucket + RLS policies for custom collection
-- cover photos. Mirrors the inheritor / conservator / people photo
-- buckets — public read (paths are unguessable UUIDs), writes scoped
-- to the owning auth.uid().

insert into storage.buckets (id, name, public)
  values ('custom-collection-photos', 'custom-collection-photos', true)
  on conflict (id) do nothing;

-- Path convention: <owner_id>/<random-uuid>.<ext>
-- Only the owning user (split_part(name, '/', 1) = auth.uid()) may
-- insert, update, or delete their own files.

drop policy if exists "custom-collection-photos: owner insert" on storage.objects;
create policy "custom-collection-photos: owner insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'custom-collection-photos'
    and (split_part(name, '/', 1))::uuid = auth.uid()
  );

drop policy if exists "custom-collection-photos: owner update" on storage.objects;
create policy "custom-collection-photos: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'custom-collection-photos'
    and (split_part(name, '/', 1))::uuid = auth.uid()
  )
  with check (
    bucket_id = 'custom-collection-photos'
    and (split_part(name, '/', 1))::uuid = auth.uid()
  );

drop policy if exists "custom-collection-photos: owner delete" on storage.objects;
create policy "custom-collection-photos: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'custom-collection-photos'
    and (split_part(name, '/', 1))::uuid = auth.uid()
  );

-- Reads are public (bucket is public). No SELECT policy needed.
