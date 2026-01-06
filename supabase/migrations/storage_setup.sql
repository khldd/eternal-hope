-- Enable the storage extension (if not enabled, usually enabled by default)
-- create extension if not exists "storage" schema "extensions";

-- Create specific bucket for photos
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Set up security policies for the bucket
-- Allow public read access
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'photos' );

-- Allow authenticated uploads (users can upload)
create policy "Authenticated Uploads"
  on storage.objects for insert
  with check ( bucket_id = 'photos' );

-- Allow users to update/delete their own files (optional, but good practice)
create policy "Users can update own files"
  on storage.objects for update
  using ( bucket_id = 'photos' );

create policy "Users can delete own files"
  on storage.objects for delete
  using ( bucket_id = 'photos' );
