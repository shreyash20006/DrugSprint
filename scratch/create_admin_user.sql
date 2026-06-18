-- ═══════════════════════════════════════
-- Create developer@tgpcopcouncil.online user with password
-- Run in Supabase SQL Editor (as service_role)
-- ═══════════════════════════════════════

-- Create the auth user
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
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'developer@tgpcopcouncil.online'
);

-- Verify user was created
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'developer@tgpcopcouncil.online';

SELECT 'User created ✅' as status;
