-- ═══════════════════════════════════════════════════════════════
-- TGPCOP ROLE-BASED ACCESS CONTROL (RBAC) & UNIFIED PROFILES SCHEMA
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ═══════════════════════════════════════════════════════════════

-- 1. EXTEND/CREATE UNIFIED PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all required columns are added if the table already existed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year TEXT;

-- 2. SAFE INLINE DATA MIGRATION
DO $$
BEGIN
  -- Copy 'name' to 'full_name' if 'name' column exists and 'full_name' is null
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'name') THEN
    UPDATE public.profiles SET full_name = name WHERE full_name IS NULL;
  END IF;
  
  -- Copy 'is_suspended' to 'is_active' if 'is_suspended' column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_suspended') THEN
    UPDATE public.profiles SET is_active = NOT is_suspended;
  END IF;
END $$;

-- 3. RECURSIVE-SAFE SECURITY DEFINER HELPER FUNCTION FOR RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent duplicate conflict errors
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authorized roles can manage all profiles" ON public.profiles;

-- Create policies
CREATE POLICY "Anyone can read profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update profiles" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.get_my_role() IN ('super_admin', 'admin', 'developer')
  );

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    public.get_my_role() IN ('super_admin', 'developer')
  );

-- 5. DATABASE CONSTRAINT TRIGGER FOR SECURE ROLE & SUSPENSION CHANGES
CREATE OR REPLACE FUNCTION public.check_profile_update()
RETURNS trigger AS $$
DECLARE
  updater_role TEXT;
BEGIN
  -- If executed via backend/SQL Editor/Service Role (where auth.uid() is null), bypass the security check
  IF auth.uid() IS NULL THEN
    NEW.updated_at = now();
    RETURN NEW;
  END IF;

  -- Fetch updater's role
  updater_role := public.get_my_role();

  -- If the role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Only super_admin or developer can change roles.
    IF COALESCE(updater_role, '') NOT IN ('super_admin', 'developer') THEN
      RAISE EXCEPTION 'Unauthorized: Only Super Admin or Developer can modify roles.';
    END IF;
  END IF;

  -- If the active status (suspension status) is being changed
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    IF COALESCE(updater_role, '') NOT IN ('super_admin', 'developer', 'admin') THEN
      RAISE EXCEPTION 'Unauthorized: Only Admins can suspend or reactivate accounts.';
    END IF;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS before_profile_update ON public.profiles;
CREATE TRIGGER before_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_update();

-- 6. AUTOMATIC TRIGGER FOR OAUTH USER SIGNUP PROFILE REGISTRATION WITH AUTO-ROLE ASSIGNMENT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  -- Determine role based on email address matching the pre-allocated domains exactly
  assigned_role := CASE LOWER(new.email)
    WHEN 'sb108750@gmail.com' THEN 'super_admin'
    WHEN 'developer@tgpcopcouncil.online' THEN 'developer'
    WHEN 'overall-secretary@tgpcopcouncil.online' THEN 'secretary'
    WHEN 'vicepresident@tgpcopcouncil.online' THEN 'vice_president'
    WHEN 'treasurer@tgpcopcouncil.online' THEN 'treasurer'
    WHEN 'events-coordinator@tgpcopcouncil.online' THEN 'coordinator'
    WHEN 'treasure@tgpcopcouncil.online' THEN 'treasurer'
    WHEN 'nss-incharge@tgpcopcouncil.online' THEN 'coordinator'
    WHEN 'cultural-secretary@tgpcopcouncil.online' THEN 'coordinator'
    WHEN 'secretary@tgpcopcouncil.online' THEN 'secretary'
    WHEN 'general-secretary@tgpcopcouncil.online' THEN 'general_secretary'
    ELSE 'student'
  END;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, is_active, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Student'),
    new.raw_user_meta_data->>'avatar_url',
    assigned_role,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    role = CASE WHEN profiles.role = 'student' THEN EXCLUDED.role ELSE profiles.role END, -- preserve custom assigned roles if any
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
