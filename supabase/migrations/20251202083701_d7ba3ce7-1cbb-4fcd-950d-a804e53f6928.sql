-- Create storage bucket for user avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Create RLS policies for avatars bucket
create policy "Users can view all avatars"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own avatar"
on storage.objects for delete
using (
  bucket_id = 'avatars' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Add preferences column to profiles table
alter table public.profiles
add column preferences jsonb default '{
  "theme": "light",
  "notifications": true,
  "autoSave": true,
  "language": "en"
}'::jsonb;