-- Check 1: Recent payments
SELECT id, student_name, student_email, purpose, amount, status, user_id
FROM public.payments
ORDER BY created_at DESC
LIMIT 10;

-- Check 2: RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'payments';

-- Check 3: Is RLS enabled?
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'payments';

-- Check 4: Columns that exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'payments' AND table_schema = 'public'
ORDER BY ordinal_position;
