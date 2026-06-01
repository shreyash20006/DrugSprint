-- Check 1: What does the handle_new_user trigger do?
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%new_user%' OR routine_name LIKE '%handle%'
AND routine_schema = 'public';

-- Check 2: All triggers on auth.users
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- Check 3: pre_authorized_emails table contents
SELECT * FROM public.pre_authorized_emails ORDER BY created_at DESC;

-- Check 4: Check if tgpcopcouncil.online users exist in auth.users
SELECT id, email, created_at, raw_user_meta_data->>'full_name' as name
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
