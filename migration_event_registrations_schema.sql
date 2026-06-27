-- Migration to align event_registrations schema with the frontend codebase

-- 1. Rename columns if they exist under their old names
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'event_registrations' AND column_name = 'student_name'
  ) THEN
    ALTER TABLE public.event_registrations RENAME COLUMN student_name TO full_name;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'event_registrations' AND column_name = 'student_email'
  ) THEN
    ALTER TABLE public.event_registrations RENAME COLUMN student_email TO email;
  END IF;
END $$;

-- 2. Add missing columns to the event_registrations table
ALTER TABLE public.event_registrations 
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS year TEXT;

-- 3. Enable RLS on event_registrations (if not already enabled)
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for event_registrations to allow public/authenticated inserts
DROP POLICY IF EXISTS "Allow public/authenticated inserts to event_registrations" ON public.event_registrations;
CREATE POLICY "Allow public/authenticated inserts to event_registrations" 
  ON public.event_registrations
  FOR INSERT 
  TO public, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users/admins to view event_registrations" ON public.event_registrations;
CREATE POLICY "Allow users/admins to view event_registrations" 
  ON public.event_registrations
  FOR SELECT 
  TO public, authenticated
  USING (true);
