-- Migration: Add photo_urls and ai_general_description columns
-- Run this in Supabase SQL Editor if you already have the places table

-- Add photo URLs array for storing Google Maps photos
ALTER TABLE places ADD COLUMN IF NOT EXISTS photo_urls text[];

-- Add general AI description field
ALTER TABLE places ADD COLUMN IF NOT EXISTS ai_general_description text;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'places' 
AND column_name IN ('photo_urls', 'ai_general_description');
