-- ═══════════════════════════════════════════════════════════════
-- TGPCOP STUDENT COUNCIL PORTAL - ROLE MANAGEMENT SYSTEM (RBAC)
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

-- Ensure all required columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- 2. CREATE ADMIN_ROLES LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on admin_roles
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- 3. DROP & RECREATE POLICIES FOR ADMIN_ROLES
DROP POLICY IF EXISTS "Anyone can read admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Only super_admins can write admin_roles" ON public.admin_roles;

CREATE POLICY "Anyone can read admin_roles" ON public.admin_roles
  FOR SELECT USING (true);

CREATE POLICY "Only super_admins can write admin_roles" ON public.admin_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

-- 4. CREATE DATABASE SYNC TRIGGER BETWEEN ADMIN_ROLES AND PROFILES
CREATE OR REPLACE FUNCTION public.sync_admin_role_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.profiles
    SET role = NEW.role
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET role = 'student'
    WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_admin_role_to_profile ON public.admin_roles;
CREATE TRIGGER trg_sync_admin_role_to_profile
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_roles
  FOR EACH ROW EXECUTE FUNCTION public.sync_admin_role_to_profile();

-- 5. RECURSIVE-SAFE SECURITY DEFINER ROLE RETRIEVAL FUNCTION
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. DROP & RECREATE POLICIES FOR PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Anyone can read profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update profiles" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.get_my_role() IN ('super_admin', 'developer')
  );

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    public.get_my_role() IN ('super_admin', 'developer')
  );

-- 7. RE-DESIGN Handle New User Signup Domain Mappings trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  assigned_role := CASE LOWER(new.email)
    -- System Administrators
    WHEN 'sb108750@gmail.com' THEN 'super_admin'
    WHEN 'innovate.tgpcet@gmail.com' THEN 'super_admin'
    WHEN 'developer@tgpcopcouncil.online' THEN 'super_admin'
    
    -- Executive Officers
    WHEN 'president@tgpcopcouncil.online' THEN 'president'
    WHEN 'vicepresident@tgpcopcouncil.online' THEN 'vice_president'
    WHEN 'general-secretary@tgpcopcouncil.online' THEN 'general_secretary'
    WHEN 'secretary@tgpcopcouncil.online' THEN 'secretary'
    WHEN 'treasurer@tgpcopcouncil.online' THEN 'treasurer'
    
    -- Special Secretaries & Incharges
    WHEN 'events-coordinator@tgpcopcouncil.online' THEN 'events'
    WHEN 'cultural-secretary@tgpcopcouncil.online' THEN 'cultural'
    WHEN 'nss-incharge@tgpcopcouncil.online' THEN 'nss'
    WHEN 'antiragging-incharge@tgpcopcouncil.online' THEN 'anti_ragging'
    WHEN 'socialmedia-incharge@tgpcopcouncil.online' THEN 'social_media'
    WHEN 'issues-rep@tgpcopcouncil.online' THEN 'college_issues'
    
    -- General Admin
    WHEN 'overall-secretary@tgpcopcouncil.online' THEN 'admin'
    
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
  ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    role = EXCLUDED.role,
    is_active = true,
    updated_at = now();

  -- If the role assigned is an admin/council role, also log into admin_roles table
  IF assigned_role != 'student' THEN
    INSERT INTO public.admin_roles (user_id, role, created_at)
    VALUES (new.id, assigned_role, now())
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-establish Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
