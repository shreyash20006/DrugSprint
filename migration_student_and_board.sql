-- ═══════════════════════════════════════════════════════════════
-- TGPCOP NEW FEATURES — STUDENT PROFILES & MESSAGE BOARD MIGRATION
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ═══════════════════════════════════════════════════════════════

-- 1. STUDENT PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  year TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Students see own profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Students insert own profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Students update own profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Admin see all student profiles" ON public.student_profiles;

-- Create policies
CREATE POLICY "Students see own profile" ON public.student_profiles 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students insert own profile" ON public.student_profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students update own profile" ON public.student_profiles 
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin see all student profiles" ON public.student_profiles 
  FOR SELECT USING (auth.role() = 'authenticated');


-- 2. MESSAGES TABLE (MESSAGE BOARD)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  author_email TEXT,
  reply TEXT,
  reply_by TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read approved messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Admin manage messages" ON public.messages;

-- Create policies
CREATE POLICY "Anyone can read approved messages" ON public.messages 
  FOR SELECT USING (is_approved = true OR auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert messages" ON public.messages 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin manage messages" ON public.messages 
  FOR ALL USING (auth.role() = 'authenticated');
