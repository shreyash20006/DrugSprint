-- Migration: Create admin_logs table and enable security policies

-- 1. Create table
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email text NOT NULL,
  admin_name text NOT NULL,
  action text NOT NULL,
  details text,
  created_at timestamp DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
DROP POLICY IF EXISTS "Auth users insert logs" ON admin_logs;
CREATE POLICY "Auth users insert logs"
  ON admin_logs FOR INSERT TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Developer read logs" ON admin_logs;
CREATE POLICY "Developer read logs"
  ON admin_logs FOR SELECT TO authenticated 
  USING (true);

-- 4. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
