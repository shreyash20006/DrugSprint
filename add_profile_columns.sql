-- DDL to expand the profiles table to support dynamic council profiles
-- Execute these commands inside your Supabase Dashboard SQL Editor (https://supabase.com)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year text;

-- Add a comment on these columns for future reference
COMMENT ON COLUMN profiles.name IS 'Council member full name';
COMMENT ON COLUMN profiles.avatar_url IS 'Council member public profile photo URL';
COMMENT ON COLUMN profiles.phone IS 'Council member public phone number';
COMMENT ON COLUMN profiles.year IS 'Council member course & year (e.g. B.Pharm III Year)';

-- =========================================================================
-- STORAGE BUCKET CREATION FOR DIRECT UPLOADS (College Logo, Banner, Favicon, etc.)
-- =========================================================================

-- 1. Create the 'branding' bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Updates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Deletes" ON storage.objects;

-- 3. Create public read policy (anyone can fetch branding assets and gallery photos/videos)
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'branding');

-- 4. Create upload policy for authenticated admins
CREATE POLICY "Authenticated Uploads" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'branding');

-- 5. Create edit policy for authenticated admins
CREATE POLICY "Authenticated Updates" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'branding');

-- 6. Create delete policy for authenticated admins
CREATE POLICY "Authenticated Deletes" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'branding');
