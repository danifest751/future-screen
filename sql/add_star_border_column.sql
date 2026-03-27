-- Migration: Add star_border_enabled column to site_settings table
-- This enables the global Star Border animation toggle

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS star_border_enabled BOOLEAN DEFAULT false;

-- Update existing rows to have default value
UPDATE site_settings 
SET star_border_enabled = false 
WHERE star_border_enabled IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN site_settings.star_border_enabled IS 'Global toggle for Star Border hover animation effect';
