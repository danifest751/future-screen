-- Migration: Add star_border_settings column to site_settings table
-- This enables the global Star Border animation with full configuration

-- Drop old column if exists
ALTER TABLE site_settings 
DROP COLUMN IF EXISTS star_border_enabled;

-- Add new JSONB column for Star Border settings
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS star_border_settings JSONB DEFAULT '{
  "enabled": false,
  "color": "#667eea",
  "speed": 6,
  "thickness": 1,
  "intensity": 1
}'::jsonb;

-- Update existing rows to have default value
UPDATE site_settings 
SET star_border_settings = '{
  "enabled": false,
  "color": "#667eea",
  "speed": 6,
  "thickness": 1,
  "intensity": 1
}'::jsonb
WHERE star_border_settings IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN site_settings.star_border_settings IS 'Star Border animation settings: enabled, color, speed, thickness, intensity';
