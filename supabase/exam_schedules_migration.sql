-- =====================================================
-- TGPCOP: Exam Schedules Table
-- Run this SQL in Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS exam_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name  TEXT NOT NULL,
  subject_code  TEXT,
  semester      TEXT NOT NULL,           -- e.g. 'Sem I', 'Sem III'
  year          TEXT NOT NULL,           -- e.g. '1st Year', '2nd Year'
  exam_date     DATE NOT NULL,
  exam_time     TEXT NOT NULL DEFAULT '10:00',
  exam_type     TEXT NOT NULL DEFAULT 'Regular'
                  CHECK (exam_type IN ('Regular', 'Supplementary')),
  status        TEXT NOT NULL DEFAULT 'Scheduled'
                  CHECK (status IN ('Scheduled', 'Postponed', 'Completed', 'Cancelled')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_exam_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_exam_schedules_updated_at ON exam_schedules;
CREATE TRIGGER set_exam_schedules_updated_at
  BEFORE UPDATE ON exam_schedules
  FOR EACH ROW EXECUTE FUNCTION update_exam_schedules_updated_at();

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_exam_schedules_date     ON exam_schedules(exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_type     ON exam_schedules(exam_type);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_sem_year ON exam_schedules(semester, year);

-- RLS: Public can read, only authenticated admins can write
ALTER TABLE exam_schedules ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read exam schedules (students need to see this)
CREATE POLICY "Public can view exam schedules"
  ON exam_schedules FOR SELECT
  USING (true);

-- Only authenticated users (admins) can insert / update / delete
CREATE POLICY "Admins can manage exam schedules"
  ON exam_schedules FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- Done! Now go to Admin Panel > Exam Schedule to add exams
-- =====================================================
