-- Allow anyone to read from the bucket
create policy "Public read" on storage.objects
  for select using (bucket_id = 'publics');

-- Allow authenticated users to upload / delete their own avatars
create policy "User avatar upload" on storage.objects
  for insert with check (bucket_id = 'publics' and auth.role() = 'authenticated');

create policy "User avatar delete" on storage.objects
  for delete using (bucket_id = 'publics' and auth.role() = 'authenticated');