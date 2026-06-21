-- ═══════════════════════════════════════════════════════════════
-- TGPCOP LINKEDIN AUTHENTICATION & EXTRA PROFILE FIELDS MIGRATION
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ═══════════════════════════════════════════════════════════════

-- 1. ADD NEW COLUMNS FOR LINKEDIN AUTHENTICATION & ONBOARDING
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS semester TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS prn TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.course IS 'Academic course selected by the user (e.g. B.Pharm, D.Pharm)';
COMMENT ON COLUMN public.profiles.semester IS 'Academic Year/Semester of the user';
COMMENT ON COLUMN public.profiles.prn IS 'University Enrollment Permanent Registration Number (DBATU)';
COMMENT ON COLUMN public.profiles.linkedin_id IS 'Unique identifier from LinkedIn OIDC OAuth';

-- 2. UPDATE THE HANDLE_NEW_USER TRIGGER FUNCTION TO AUTOMATICALLY CAPTURE LINKEDIN ID
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role TEXT;
  linkedin_uid TEXT;
BEGIN
  -- Determine role based on pre-authorized email addresses
  assigned_role := CASE new.email
    WHEN 'overall-secretary@tgpcopcouncil.online' THEN 'secretary'
    WHEN 'vicepresident@tgpcopcouncil.online'     THEN 'vice_president'
    WHEN 'treasurer@tgpcopcouncil.online'         THEN 'treasurer'
    WHEN 'events-coordinator@tgpcopcouncil.online'THEN 'coordinator'
    WHEN 'nss-incharge@tgpcopcouncil.online'      THEN 'coordinator'
    WHEN 'cultural-secretary@tgpcopcouncil.online'THEN 'coordinator'
    WHEN 'secretary@tgpcopcouncil.online'         THEN 'secretary'
    WHEN 'general-secretary@tgpcopcouncil.online' THEN 'general_secretary'
    ELSE 'student'
  END;

  -- Extract LinkedIn ID if signing in via linkedin_oidc
  IF new.raw_app_meta_data->>'provider' = 'linkedin_oidc' THEN
    linkedin_uid := new.raw_user_meta_data->>'sub';
  ELSE
    linkedin_uid := NULL;
  END IF;

  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    avatar_url, 
    role, 
    is_active, 
    created_at, 
    updated_at, 
    linkedin_id
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Member'),
    new.raw_user_meta_data->>'avatar_url',
    assigned_role,
    true,
    now(),
    now(),
    linkedin_uid
  )
  ON CONFLICT (email) DO UPDATE SET
    id       = EXCLUDED.id,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    role     = EXCLUDED.role,
    is_active = true,
    linkedin_id = COALESCE(EXCLUDED.linkedin_id, profiles.linkedin_id),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
