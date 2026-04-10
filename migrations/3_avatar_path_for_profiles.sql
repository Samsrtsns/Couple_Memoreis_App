-- ============================================================================
-- Profil avatar altyapisi
-- "Could not find avatar_path column of profiles" hatasini giderir
-- ============================================================================

-- 1) profiles tablosuna avatar kolonlari
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_path text;

-- 2) Profil avatarlari icin storage bucket
INSERT INTO storage.buckets (id, name, public)
SELECT 'profile-photos', 'profile-photos', true
WHERE NOT EXISTS (
  SELECT 1
  FROM storage.buckets
  WHERE id = 'profile-photos'
);

-- 3) RLS policy: herkes okuyabilir (public avatar)
DROP POLICY IF EXISTS "Public read profile photos" ON storage.objects;
CREATE POLICY "Public read profile photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-photos');

-- 4) RLS policy: kullanici sadece kendi klasorune upload yapabilir
DROP POLICY IF EXISTS "Users can upload own profile photos" ON storage.objects;
CREATE POLICY "Users can upload own profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- 5) RLS policy: kullanici kendi dosyasini guncelleyebilsin
DROP POLICY IF EXISTS "Users can update own profile photos" ON storage.objects;
CREATE POLICY "Users can update own profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-photos'
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- 6) RLS policy: kullanici kendi dosyasini silebilsin
DROP POLICY IF EXISTS "Users can delete own profile photos" ON storage.objects;
CREATE POLICY "Users can delete own profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND split_part(name, '/', 1) = auth.uid()::text
);
