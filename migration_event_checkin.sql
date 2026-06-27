-- =========================================================
-- TGPCOP Event Check-in System — Database Migration
-- Run in Supabase SQL Editor
-- =========================================================

-- 1. QR & check-in columns on registrations
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS qr_token TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS qr_payload TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS checked_in BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS checked_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS manual_check_in BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_qr_token ON registrations(qr_token) WHERE qr_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_registrations_checked_in ON registrations(checked_in);
CREATE INDEX IF NOT EXISTS idx_registrations_service_checked ON registrations(service_id, checked_in);

-- 2. Role helpers (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION is_checkin_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND role IN (
        'super_admin', 'admin', 'developer', 'treasurer', 'coordinator',
        'president', 'vice_president', 'general_secretary', 'secretary'
      )
  );
$$;

CREATE OR REPLACE FUNCTION is_super_checkin_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND role IN ('super_admin', 'developer')
  );
$$;

-- 3. Build registration JSON for scanner UI
CREATE OR REPLACE FUNCTION registration_checkin_payload(p_reg registrations)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_name TEXT;
  v_service_category TEXT;
  v_avatar TEXT;
  v_checked_by_name TEXT;
BEGIN
  SELECT s.name, s.category INTO v_service_name, v_service_category
  FROM services s WHERE s.id = p_reg.service_id;

  IF p_reg.user_id IS NOT NULL THEN
    SELECT avatar_url INTO v_avatar FROM profiles WHERE id = p_reg.user_id;
  END IF;

  IF p_reg.checked_by IS NOT NULL THEN
    SELECT full_name INTO v_checked_by_name FROM profiles WHERE id = p_reg.checked_by;
  END IF;

  RETURN jsonb_build_object(
    'id', p_reg.id,
    'registration_id', p_reg.registration_id,
    'full_name', p_reg.full_name,
    'email', p_reg.email,
    'phone', p_reg.phone,
    'college', p_reg.college,
    'branch', p_reg.branch,
    'year', p_reg.year,
    'prn', p_reg.prn,
    'payment_status', p_reg.payment_status,
    'amount_paid', p_reg.amount_paid,
    'checked_in', p_reg.checked_in,
    'checked_in_at', p_reg.checked_in_at,
    'checked_by', p_reg.checked_by,
    'checked_by_name', v_checked_by_name,
    'manual_check_in', p_reg.manual_check_in,
    'service_id', p_reg.service_id,
    'service_name', v_service_name,
    'service_category', v_service_category,
    'avatar_url', v_avatar,
    'certificate_issued_at', p_reg.certificate_issued_at
  );
END;
$$;

-- 4. Verify QR and check in (atomic — first scan only)
CREATE OR REPLACE FUNCTION verify_and_checkin_qr(
  p_token TEXT,
  p_registration_id TEXT,
  p_service_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg registrations%ROWTYPE;
BEGIN
  IF NOT is_checkin_admin() THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'UNAUTHORIZED', 'message', 'Admin access required');
  END IF;

  SELECT * INTO v_reg
  FROM registrations
  WHERE qr_token = p_token
    AND registration_id = p_registration_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid', 'message', 'Invalid QR code');
  END IF;

  IF p_service_id IS NOT NULL AND v_reg.service_id IS DISTINCT FROM p_service_id THEN
    RETURN jsonb_build_object('status', 'invalid', 'message', 'QR is for a different event');
  END IF;

  IF v_reg.payment_status IS DISTINCT FROM 'completed' THEN
    RETURN jsonb_build_object('status', 'invalid', 'message', 'Payment not completed', 'registration', registration_checkin_payload(v_reg));
  END IF;

  IF v_reg.checked_in THEN
    RETURN jsonb_build_object(
      'status', 'already_checked_in',
      'message', 'Already checked in',
      'registration', registration_checkin_payload(v_reg)
    );
  END IF;

  UPDATE registrations
  SET
    checked_in = true,
    checked_in_at = now(),
    checked_by = auth.uid(),
    manual_check_in = false,
    updated_at = now()
  WHERE id = v_reg.id
  RETURNING * INTO v_reg;

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Check-in successful',
    'registration', registration_checkin_payload(v_reg)
  );
END;
$$;

-- 5. Super Admin: reset check-in
CREATE OR REPLACE FUNCTION reset_checkin(p_registration_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg registrations%ROWTYPE;
BEGIN
  IF NOT is_super_checkin_admin() THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'FORBIDDEN', 'message', 'Super Admin access required');
  END IF;

  UPDATE registrations
  SET
    checked_in = false,
    checked_in_at = NULL,
    checked_by = NULL,
    manual_check_in = false,
    updated_at = now()
  WHERE id = p_registration_uuid
  RETURNING * INTO v_reg;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Registration not found');
  END IF;

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Check-in reset',
    'registration', registration_checkin_payload(v_reg)
  );
END;
$$;

-- 6. Super Admin: manual check-in (no QR)
CREATE OR REPLACE FUNCTION manual_checkin(p_registration_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg registrations%ROWTYPE;
BEGIN
  IF NOT is_super_checkin_admin() THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'FORBIDDEN', 'message', 'Super Admin access required');
  END IF;

  SELECT * INTO v_reg FROM registrations WHERE id = p_registration_uuid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Registration not found');
  END IF;

  IF v_reg.payment_status IS DISTINCT FROM 'completed' THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Payment not completed');
  END IF;

  IF v_reg.checked_in THEN
    RETURN jsonb_build_object(
      'status', 'already_checked_in',
      'registration', registration_checkin_payload(v_reg)
    );
  END IF;

  UPDATE registrations
  SET
    checked_in = true,
    checked_in_at = now(),
    checked_by = auth.uid(),
    manual_check_in = true,
    updated_at = now()
  WHERE id = p_registration_uuid
  RETURNING * INTO v_reg;

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Manual check-in recorded',
    'registration', registration_checkin_payload(v_reg)
  );
END;
$$;

-- 7. Super Admin: bulk manual attendance
CREATE OR REPLACE FUNCTION bulk_manual_checkin(p_registration_uuids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_updated INT := 0;
  v_skipped INT := 0;
BEGIN
  IF NOT is_super_checkin_admin() THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'FORBIDDEN', 'message', 'Super Admin access required');
  END IF;

  FOREACH v_id IN ARRAY p_registration_uuids LOOP
    UPDATE registrations
    SET
      checked_in = true,
      checked_in_at = COALESCE(checked_in_at, now()),
      checked_by = COALESCE(checked_by, auth.uid()),
      manual_check_in = true,
      updated_at = now()
    WHERE id = v_id
      AND payment_status = 'completed'
      AND checked_in = false;

    IF FOUND THEN
      v_updated := v_updated + 1;
    ELSE
      v_skipped := v_skipped + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'success',
    'updated', v_updated,
    'skipped', v_skipped
  );
END;
$$;

-- 8. Mark certificate issued (checked-in only)
CREATE OR REPLACE FUNCTION mark_certificate_issued(p_registration_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg registrations%ROWTYPE;
BEGIN
  IF NOT is_checkin_admin() THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'UNAUTHORIZED');
  END IF;

  SELECT * INTO v_reg FROM registrations WHERE id = p_registration_uuid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Registration not found');
  END IF;

  IF NOT v_reg.checked_in THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Student must be checked in before certificate issuance');
  END IF;

  UPDATE registrations
  SET certificate_issued_at = now(), updated_at = now()
  WHERE id = p_registration_uuid
  RETURNING * INTO v_reg;

  RETURN jsonb_build_object('status', 'success', 'registration', registration_checkin_payload(v_reg));
END;
$$;

GRANT EXECUTE ON FUNCTION verify_and_checkin_qr(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_checkin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION manual_checkin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_manual_checkin(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_certificate_issued(UUID) TO authenticated;

-- 9. Realtime (idempotent)
ALTER PUBLICATION supabase_realtime ADD TABLE registrations;
