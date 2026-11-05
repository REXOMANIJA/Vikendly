-- Vikendly: fix deleting house photos from Storage
-- Run once in Supabase → SQL Editor, after 0002_admin.sql.
--
-- Supabase Storage only removes a file if the user may both SELECT and DELETE it.
-- 0002 granted admins delete but not select, so deleting a house left its photos behind.

create policy "Admins can list house photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'house-photos' and (select public.is_admin()));
