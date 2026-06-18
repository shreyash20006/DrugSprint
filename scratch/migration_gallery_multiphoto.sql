-- Gallery Multi-Photo Album Migration Script
-- Run this in your Supabase Dashboard -> SQL Editor to add support for multiple photos in a single gallery post.

-- 1. Add array column to support multiple photo URLs in one post
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';

-- 2. Backfill existing rows (put their single media_url into the media_urls array)
UPDATE gallery 
SET media_urls = ARRAY[media_url] 
WHERE media_urls = '{}' OR media_urls IS NULL;

-- 3. Verify columns were added and backfilled
SELECT id, title, media_url, media_urls FROM gallery LIMIT 5;
