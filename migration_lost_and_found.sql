-- Migration: Create lost_and_found table and enable security policies

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.lost_and_found (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('lost', 'found')),
  location TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reporter_name TEXT NOT NULL,
  reporter_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.lost_and_found ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
DROP POLICY IF EXISTS "Allow authenticated select lost_and_found" ON public.lost_and_found;
CREATE POLICY "Allow authenticated select lost_and_found"
  ON public.lost_and_found FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert lost_and_found" ON public.lost_and_found;
CREATE POLICY "Allow authenticated insert lost_and_found"
  ON public.lost_and_found FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Allow owners and admins to update lost_and_found" ON public.lost_and_found;
CREATE POLICY "Allow owners and admins to update lost_and_found"
  ON public.lost_and_found FOR UPDATE TO authenticated
  USING (
    auth.uid() = reporter_id OR public.get_my_role() IN ('super_admin', 'admin', 'developer')
  );

DROP POLICY IF EXISTS "Allow owners and admins to delete lost_and_found" ON public.lost_and_found;
CREATE POLICY "Allow owners and admins to delete lost_and_found"
  ON public.lost_and_found FOR DELETE TO authenticated
  USING (
    auth.uid() = reporter_id OR public.get_my_role() IN ('super_admin', 'admin', 'developer')
  );

-- 4. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
