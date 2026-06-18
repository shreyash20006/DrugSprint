-- =====================================================
-- TGPCOP: stories Table (Instagram-style stories that expire after 24 hours)
-- Run this SQL in Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS stories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_url   TEXT NOT NULL,
  title       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Index for fast active query filtering
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);

-- RLS: Public can read active, authenticated admins can write
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active stories
DROP POLICY IF EXISTS "Public can view active stories" ON stories;
CREATE POLICY "Public can view active stories"
  ON stories FOR SELECT
  USING (expires_at > now());

-- Only authenticated admins can manage stories
DROP POLICY IF EXISTS "Admins can manage stories" ON stories;
CREATE POLICY "Admins can manage stories"
  ON stories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
