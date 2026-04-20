-- Add font_size column to site_content table for privacy policy font scaling
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS font_size VARCHAR(10) DEFAULT NULL;