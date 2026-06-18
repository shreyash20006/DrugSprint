-- Check what payments actually exist in DB
SELECT id, student_name, student_email, status, amount, user_id, created_at
FROM public.payments
ORDER BY created_at DESC
LIMIT 20;
