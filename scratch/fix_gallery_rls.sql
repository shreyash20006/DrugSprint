-- Fix: Gallery table RLS policies for admin users
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Allow authenticated admins to INSERT into gallery
DROP POLICY IF EXISTS "Admins can insert gallery" ON gallery;
CREATE POLICY "Admins can insert gallery" ON gallery
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN (
          'admin', 'developer', 'super_admin',
          'president', 'vice_president', 'general_secretary',
          'secretary', 'treasurer', 'coordinator'
        )
    )
  );

-- 2. Allow authenticated admins to UPDATE gallery
DROP POLICY IF EXISTS "Admins can update gallery" ON gallery;
CREATE POLICY "Admins can update gallery" ON gallery
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN (
          'admin', 'developer', 'super_admin',
          'president', 'vice_president', 'general_secretary',
          'secretary', 'treasurer', 'coordinator'
        )
    )
  );

-- 3. Allow authenticated admins to DELETE gallery
DROP POLICY IF EXISTS "Admins can delete gallery" ON gallery;
CREATE POLICY "Admins can delete gallery" ON gallery
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN (
          'admin', 'developer', 'super_admin',
          'president', 'vice_president', 'general_secretary',
          'secretary', 'treasurer', 'coordinator'
        )
    )
  );

-- 4. Verify policies applied
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'gallery';
