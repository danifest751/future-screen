-- Migration: Media Library for Cases
-- Creates tables for centralized media storage with tags

-- ============================================
-- Table: media_items
-- Stores all media files (images and videos) with metadata
-- ============================================
CREATE TABLE IF NOT EXISTS media_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    public_url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- in seconds for videos
    thumbnail_url TEXT, -- for video previews
    uploaded_by TEXT NOT NULL DEFAULT 'admin' CHECK (uploaded_by IN ('admin', 'telegram')),
    telegram_message_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_items_tags ON media_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_media_items_type ON media_items(type);
CREATE INDEX IF NOT EXISTS idx_media_items_name ON media_items(name);
CREATE INDEX IF NOT EXISTS idx_media_items_created ON media_items(created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_media_items_updated_at
    BEFORE UPDATE ON media_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: case_media_links
-- Many-to-many relationship between cases and media items
-- ============================================
CREATE TABLE IF NOT EXISTS case_media_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(case_id, media_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_case_media_links_case_id ON case_media_links(case_id);
CREATE INDEX IF NOT EXISTS idx_case_media_links_media_id ON case_media_links(media_id);
CREATE INDEX IF NOT EXISTS idx_case_media_links_sort ON case_media_links(case_id, sort_order);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_media_links ENABLE ROW LEVEL SECURITY;

-- Public read access for media items
CREATE POLICY "Public read media_items"
    ON media_items FOR SELECT
    USING (true);

-- Authenticated users can manage media items
CREATE POLICY "Admin manage media_items"
    ON media_items FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Public read access for case_media_links
CREATE POLICY "Public read case_media_links"
    ON case_media_links FOR SELECT
    USING (true);

-- Authenticated users can manage case_media_links
CREATE POLICY "Admin manage case_media_links"
    ON case_media_links FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- Storage Bucket Setup (manual step required)
-- ============================================
-- Create bucket 'media' with public access
-- Folder structure:
--   media/images/{uuid}.jpg
--   media/videos/{uuid}.mp4
--   media/thumbnails/{uuid}.jpg

COMMENT ON TABLE media_items IS 'Centralized media library with tags support';
COMMENT ON TABLE case_media_links IS 'Links between cases and media files (many-to-many)';
