-- ═══════════════════════════════════════════════════════════════
-- COMPLETE AUTH FIX: Run this ENTIRE script in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/fmvmtzobjbxwmavwwkqx/sql/new
-- ═══════════════════════════════════════════════════════════════

-- PART 1: Fix developer@tgpcopcouncil.online auth metadata
-- ─────────────────────────────────────────────────────────
UPDATE auth.users
SET
  raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb,
  raw_user_meta_data = '{"full_name": "Developer", "email": "developer@tgpcopcouncil.online"}'::jsonb,
  aud = 'authenticated',
  role = 'authenticated'
WHERE email = 'developer@tgpcopcouncil.online';

-- PART 2: Ensure email identity exists
-- ─────────────────────────────────────────────────────────
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  '9dfaa6e5-b9f3-4662-a069-9ede343c1db8',
  '9dfaa6e5-b9f3-4662-a069-9ede343c1db8',
  '{"sub": "9dfaa6e5-b9f3-4662-a069-9ede343c1db8", "email": "developer@tgpcopcouncil.online", "email_verified": true}'::jsonb,
  'email',
  now(), now(), now()
)
ON CONFLICT (provider, provider_id) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  updated_at = now();

-- PART 3: Set password for developer@tgpcopcouncil.online
-- Password: TGPCOPDev@2024!
-- ─────────────────────────────────────────────────────────
UPDATE auth.users
SET encrypted_password = crypt('TGPCOPDev@2024!', gen_salt('bf'))
WHERE email = 'developer@tgpcopcouncil.online';

-- PART 4: Fix profiles role assignments
-- ─────────────────────────────────────────────────────────
UPDATE public.profiles
SET role = 'developer', is_active = true, updated_at = now()
WHERE email IN ('developer@tgpcopcouncil.online', 'innovate.tgpcet@gmail.com');

UPDATE public.profiles
SET role = 'super_admin', is_active = true, updated_at = now()
WHERE email = 'sb108750@gmail.com';

-- PART 5: Fix any profiles.id mismatches (profile.id != auth.users.id)
-- ─────────────────────────────────────────────────────────
UPDATE public.profiles p
SET id = u.id, updated_at = now()
FROM auth.users u
WHERE LOWER(p.email) = LOWER(u.email)
  AND p.id IS DISTINCT FROM u.id;

-- PART 6: Create sync_profile_id RPC (called by AuthProvider for self-healing)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_profile_id(p_auth_id UUID, p_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET id = p_auth_id, updated_at = now()
  WHERE LOWER(email) = LOWER(p_email)
    AND id IS DISTINCT FROM p_auth_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 7: Update handle_new_user trigger to map workspace emails
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  assigned_role := CASE LOWER(new.email)
    -- Gmail accounts (personal logins)
    WHEN 'sb108750@gmail.com'         THEN 'super_admin'
    WHEN 'innovate.tgpcet@gmail.com'  THEN 'developer'
    -- Google Workspace emails
    WHEN 'developer@tgpcopcouncil.online'         THEN 'developer'
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

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, is_active, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Member'),
    new.raw_user_meta_data->>'avatar_url',
    assigned_role,
    true,
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE SET
    id       = EXCLUDED.id,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    role     = EXCLUDED.role,
    is_active = true,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PART 8: Verify final state
-- ─────────────────────────────────────────────────────────
SELECT
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.raw_app_meta_data->>'provider' as provider,
  i.provider as identity_type,
  p.role,
  p.is_active,
  (u.id = p.id) as ids_match
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email IN (
  'developer@tgpcopcouncil.online',
  'innovate.tgpcet@gmail.com',
  'sb108750@gmail.com'
)
ORDER BY u.email;
