-- Migration: Create study_resources table and enable security policies

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.study_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  uploader_name TEXT NOT NULL,
  uploader_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.study_resources ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
DROP POLICY IF EXISTS "Allow authenticated select study_resources" ON public.study_resources;
CREATE POLICY "Allow authenticated select study_resources"
  ON public.study_resources FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert study_resources" ON public.study_resources;
CREATE POLICY "Allow authenticated insert study_resources"
  ON public.study_resources FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploader_id);

DROP POLICY IF EXISTS "Allow owners and admins to delete study_resources" ON public.study_resources;
CREATE POLICY "Allow owners and admins to delete study_resources"
  ON public.study_resources FOR DELETE TO authenticated
  USING (
    auth.uid() = uploader_id OR public.get_my_role() IN ('super_admin', 'admin', 'developer')
  );

-- 4. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
