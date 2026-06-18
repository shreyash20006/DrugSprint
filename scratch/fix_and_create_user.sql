-- ═══════════════════════════════════════════════════════════════
-- FIX 1: Add unique constraint on profiles.email (trigger needs it)
-- FIX 2: Create developer@tgpcopcouncil.online auth user
-- Run in: https://supabase.com/dashboard/project/fmvmtzobjbxwmavwwkqx/sql/new
-- ═══════════════════════════════════════════════════════════════

-- STEP 1: Add unique constraint on email in profiles
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- STEP 2: Create the auth user for developer@tgpcopcouncil.online
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'developer@tgpcopcouncil.online',
  crypt('Shreyash@123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "Developer TGPCOP", "name": "Developer TGPCOP"}'::jsonb,
  NOW(),
  NOW(),
  '', '', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'developer@tgpcopcouncil.online'
);

-- STEP 3: Verify
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'developer@tgpcopcouncil.online';

SELECT 'Done ✅' as status;
