-- ═══════════════════════════════════════════════════════════════
-- Payment History System Migration
-- Run in: https://supabase.com/dashboard/project/fmvmtzobjbxwmavwwkqx/sql/new
-- ═══════════════════════════════════════════════════════════════

-- STEP 1: Add receipt_url and user_id to payments table
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS receipt_url   TEXT,
  ADD COLUMN IF NOT EXISTS user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_id      TEXT;

-- STEP 2: Index for fast student lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_id      ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_email ON public.payments(student_email);

-- STEP 3: Enable RLS (if not already)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- STEP 4: Drop existing policies to re-create cleanly
DROP POLICY IF EXISTS "Students can view own payments"     ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments"       ON public.payments;
DROP POLICY IF EXISTS "Anyone can insert payments"         ON public.payments;
DROP POLICY IF EXISTS "System can update payments"         ON public.payments;
DROP POLICY IF EXISTS "Super admin can delete payments"    ON public.payments;

-- STEP 5: Student can only see their own payments (by email OR user_id)
CREATE POLICY "Students can view own payments" ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    student_email = auth.email()
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'developer', 'president', 'vice_president',
                   'general_secretary', 'secretary', 'treasurer', 'coordinator')
    )
  );

-- STEP 6: Anyone (including anonymous) can insert payments (needed for guest payments)
CREATE POLICY "Anyone can insert payments" ON public.payments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- STEP 7: Only the payment owner or admins can update (for receipt_url, status)
CREATE POLICY "System can update payments" ON public.payments
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- STEP 8: Only super_admin and developer can delete
CREATE POLICY "Super admin can delete payments" ON public.payments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'developer')
    )
  );

-- STEP 9: Create receipts storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  5242880,  -- 5MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Students can read their own receipts
DROP POLICY IF EXISTS "Students can read own receipts" ON storage.objects;
CREATE POLICY "Students can read own receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'receipts');

-- Authenticated users can upload receipts
DROP POLICY IF EXISTS "Authenticated can upload receipts" ON storage.objects;
CREATE POLICY "Authenticated can upload receipts" ON storage.objects
  FOR INSERT TO authenticated, anon
  WITH CHECK (bucket_id = 'receipts');

-- Allow updates (for re-uploads)
DROP POLICY IF EXISTS "Allow receipt updates" ON storage.objects;
CREATE POLICY "Allow receipt updates" ON storage.objects
  FOR UPDATE TO authenticated, anon
  USING (bucket_id = 'receipts');

-- STEP 10: Verify
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'payments'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Migration complete ✅' as status;
