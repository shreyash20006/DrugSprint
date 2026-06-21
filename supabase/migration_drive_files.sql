-- Migration: Create drive_files table and enable security policies

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.drive_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  drive_file_id TEXT UNIQUE NOT NULL,
  drive_link TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  category TEXT NOT NULL CHECK (category IN ('Notices', 'Events', 'Gallery', 'Student Uploads', 'Certificates'))
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.drive_files ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
DROP POLICY IF EXISTS "Allow select drive_files for authenticated" ON public.drive_files;
CREATE POLICY "Allow select drive_files for authenticated"
  ON public.drive_files FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow all actions drive_files for admins" ON public.drive_files;
CREATE POLICY "Allow all actions drive_files for admins"
  ON public.drive_files FOR ALL TO authenticated
  USING (
    public.get_my_role() IN ('super_admin', 'admin', 'developer', 'president', 'vice_president', 'general_secretary', 'secretary', 'treasurer', 'coordinator')
  );

-- 4. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
