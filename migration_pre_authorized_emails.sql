-- ═══════════════════════════════════════════════════════════════
-- FIX: Pre-authorized workspace emails table
-- Run in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/fmvmtzobjbxwmavwwkqx/sql/new
-- ═══════════════════════════════════════════════════════════════

-- STEP 1: Create pre_authorized_emails table (no FK constraint)
CREATE TABLE IF NOT EXISTS public.pre_authorized_emails (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'student',
  full_name   TEXT,
  added_by    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  used_at     TIMESTAMPTZ,         -- Set when user first logs in
  is_used     BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.pre_authorized_emails ENABLE ROW LEVEL SECURITY;

-- Only super_admin and developer can read/write
CREATE POLICY "admin_full_access_pre_auth" ON public.pre_authorized_emails
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'developer', 'admin')
    )
  );

-- STEP 2: Update handle_new_user trigger to check pre_authorized_emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role TEXT;
  display_name  TEXT;
  pre_auth      RECORD;
BEGIN
  -- First: Check if this email is pre-authorized
  SELECT * INTO pre_auth
  FROM public.pre_authorized_emails
  WHERE LOWER(email) = LOWER(new.email)
  LIMIT 1;

  IF FOUND THEN
    assigned_role := pre_auth.role;
    display_name  := COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      pre_auth.full_name,
      split_part(new.email, '@', 1)
    );
    -- Mark as used
    UPDATE public.pre_authorized_emails
    SET is_used = TRUE, used_at = now()
    WHERE id = pre_auth.id;
  ELSE
    -- Fallback: hardcoded email map
    assigned_role := CASE LOWER(new.email)
      WHEN 'sb108750@gmail.com'                         THEN 'super_admin'
      WHEN 'innovate.tgpcet@gmail.com'                  THEN 'developer'
      WHEN 'developer@tgpcopcouncil.online'             THEN 'developer'
      WHEN 'president@tgpcopcouncil.online'             THEN 'president'
      WHEN 'vicepresident@tgpcopcouncil.online'         THEN 'vice_president'
      WHEN 'general-secretary@tgpcopcouncil.online'     THEN 'general_secretary'
      WHEN 'secretary@tgpcopcouncil.online'             THEN 'secretary'
      WHEN 'treasurer@tgpcopcouncil.online'             THEN 'treasurer'
      WHEN 'events-coordinator@tgpcopcouncil.online'    THEN 'coordinator'
      WHEN 'cultural-secretary@tgpcopcouncil.online'    THEN 'coordinator'
      WHEN 'nss-incharge@tgpcopcouncil.online'          THEN 'coordinator'
      WHEN 'admin@tgpcopcouncil.online'                 THEN 'admin'
      ELSE 'student'
    END;
    display_name := COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    );
  END IF;

  -- Insert or update profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, is_active, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    display_name,
    new.raw_user_meta_data->>'avatar_url',
    assigned_role,
    true,
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE SET
    id         = EXCLUDED.id,
    full_name  = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    role       = EXCLUDED.role,
    is_active  = true,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 3: Verify table was created
SELECT 'pre_authorized_emails table created ✅' as status;
SELECT COUNT(*) as existing_entries FROM public.pre_authorized_emails;
