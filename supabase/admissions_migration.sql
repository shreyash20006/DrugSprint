-- =====================================================
-- TGPCOP: admission_enquiries Table (Admissions Lead Collection)
-- =====================================================

CREATE TABLE IF NOT EXISTS admission_enquiries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT NOT NULL,
  course      TEXT NOT NULL, -- 'B.Pharm' or 'D.Pharm'
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Called - Interested', 'Called - Not Interested', 'No Answer', 'Admitted'
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_admission_enquiries_status ON admission_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_admission_enquiries_created ON admission_enquiries(created_at);

-- Enable Row Level Security
ALTER TABLE admission_enquiries ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous/student users to insert new enquiries
DROP POLICY IF EXISTS "Anyone can insert enquiries" ON admission_enquiries;
CREATE POLICY "Anyone can insert enquiries"
  ON admission_enquiries FOR INSERT
  WITH CHECK (true);

-- Only authenticated admins can read, update, or delete enquiries
DROP POLICY IF EXISTS "Admins can manage enquiries" ON admission_enquiries;
CREATE POLICY "Admins can manage enquiries"
  ON admission_enquiries FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
