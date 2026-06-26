-- =========================================================
-- TGPCOP Student Services & Payments Module - Database Schema
-- Run this in your Supabase SQL Editor
-- =========================================================

-- 1. SERVICES TABLE
-- Stores all configurable student service offerings (events, workshops, etc.)
CREATE TABLE IF NOT EXISTS services (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  category            TEXT NOT NULL DEFAULT 'Events',
  description         TEXT,
  banner_image        TEXT,
  thumbnail           TEXT,
  price               NUMERIC(10,2),
  discount_price      NUMERIC(10,2),
  currency            TEXT NOT NULL DEFAULT 'INR',
  registration_open   TIMESTAMPTZ,
  registration_close  TIMESTAMPTZ,
  max_seats           INTEGER,
  registered_count    INTEGER NOT NULL DEFAULT 0,
  allow_waiting_list  BOOLEAN NOT NULL DEFAULT false,
  status              TEXT NOT NULL DEFAULT 'open'
                        CHECK (status IN ('upcoming','open','closed','sold_out','draft')),
  is_featured         BOOLEAN NOT NULL DEFAULT false,
  is_popular          BOOLEAN NOT NULL DEFAULT false,
  is_new              BOOLEAN NOT NULL DEFAULT true,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_services_updated_at ON services;
CREATE TRIGGER set_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. REGISTRATIONS TABLE
-- All student service registrations with payment tracking
CREATE TABLE IF NOT EXISTS registrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id        UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  registration_id   TEXT NOT NULL UNIQUE,
  order_id          TEXT,
  payment_id        TEXT,
  user_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Student Details
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  college           TEXT DEFAULT 'TGPCOP Nagpur',
  branch            TEXT,
  year              TEXT,
  prn               TEXT,
  gender            TEXT,
  address           TEXT,

  -- Payment
  payment_status    TEXT NOT NULL DEFAULT 'completed'
                      CHECK (payment_status IN ('pending','completed','failed','refunded','cancelled')),
  amount_paid       NUMERIC(10,2) DEFAULT 0,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_registrations_updated_at ON registrations;
CREATE TRIGGER set_registrations_updated_at
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_registrations_service_id ON registrations(service_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);

-- 3. PAYMENT LOGS TABLE  
-- Detailed payment event tracking
CREATE TABLE IF NOT EXISTS payment_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  order_id        TEXT,
  payment_id      TEXT,
  gateway         TEXT DEFAULT 'cashfree',
  event           TEXT,  -- created, authorized, paid, failed
  amount          NUMERIC(10,2),
  currency        TEXT DEFAULT 'INR',
  status          TEXT,
  raw_payload     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================================

-- Enable RLS on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- SERVICES: Public read for active/non-draft; admin full access
DROP POLICY IF EXISTS "Public read active services" ON services;
CREATE POLICY "Public read active services" ON services
  FOR SELECT TO public
  USING (is_active = true AND status != 'draft');

DROP POLICY IF EXISTS "Authenticated admin write services" ON services;
CREATE POLICY "Authenticated admin write services" ON services
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- REGISTRATIONS: Students can insert & view their own; admins see all
DROP POLICY IF EXISTS "Students can register" ON registrations;
CREATE POLICY "Students can register" ON registrations
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Students view own registrations" ON registrations;
CREATE POLICY "Students view own registrations" ON registrations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Admins manage all registrations" ON registrations;
CREATE POLICY "Admins manage all registrations" ON registrations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin','admin','developer','treasurer','coordinator')
    )
  );

-- PAYMENT LOGS: Admin only
DROP POLICY IF EXISTS "Admins view payment logs" ON payment_logs;
CREATE POLICY "Admins view payment logs" ON payment_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin','admin','developer','treasurer')
    )
  );

-- =========================================================
-- REALTIME: Enable for instant admin dashboard updates
-- =========================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime_services CASCADE;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE services;
ALTER PUBLICATION supabase_realtime ADD TABLE registrations;

-- =========================================================
-- SAMPLE DATA: Insert 3 example services to test
-- =========================================================
INSERT INTO services (name, category, description, price, status, is_featured, is_new, max_seats, is_active)
VALUES
  ('Annual Cultural Fest 2026 Registration', 'Events', 'Register for TGPCOP''s grand annual cultural fest featuring competitions, performances, and more.', 0, 'open', true, true, 200, true),
  ('Human Anatomy Handwritten Notes (B.Pharm I)', 'Study Materials', 'Premium handwritten notes for Human Anatomy & Physiology - Semester 2. Instant digital download after payment.', 149, 'open', false, true, NULL, true),
  ('Annual Student Council Membership 2026-27', 'Membership', 'Join the TGPCOP Student Council and get exclusive benefits including priority event registration, mentorship access, and more.', 199, 'open', true, false, 100, true)
ON CONFLICT DO NOTHING;
