-- ═══════════════════════════════════════════════════════════════
-- FIX: Allow @tgpcopcouncil.online Google Workspace users to login
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- STEP 1: Check current handle_new_user trigger function
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';
