-- Fix: public.site_content.id is text (seed rows use string literals like
-- 'home_works'), but the audit-trail migration created
-- site_content_versions.site_content_id as uuid. Any write to site_content
-- then fails inside the trigger with a uuid vs text mismatch.
--
-- This migration coerces the column to text. Safe to re-run.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'site_content_versions'
      AND column_name = 'site_content_id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.site_content_versions
      ALTER COLUMN site_content_id TYPE text USING site_content_id::text;
  END IF;
END $$;
