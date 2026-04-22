-- Audit trail for public.site_content. Every INSERT/UPDATE/DELETE on a
-- site_content row is snapshotted into site_content_versions, including
-- the editor's auth.uid(). This lets admins review the edit history and
-- restore a previous value by upserting it back.
--
-- The trigger runs AFTER the write and uses SECURITY DEFINER so it can
-- insert rows regardless of RLS on the versions table. The versions
-- table itself is read-only from the public API (no INSERT/UPDATE/DELETE
-- policies), and only admins can SELECT.

-- NOTE: public.site_content.id is text (seed rows use string keys like
-- 'home_works'), so site_content_id mirrors that type — not uuid. A
-- separate fix migration (20260424000100_fix_site_content_versions_id_type)
-- patches environments that ran an earlier version of this file.
CREATE TABLE IF NOT EXISTS public.site_content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_content_id text NOT NULL,
  key text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  edited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  edited_at timestamptz NOT NULL DEFAULT now(),

  -- Snapshot of the row as it exists after the change (for DELETE we snapshot
  -- OLD since NEW is NULL). Gives a full restorable point-in-time state.
  title text,
  content text,
  content_html text,
  meta_title text,
  meta_description text,
  font_size text,
  title_en text,
  content_en text,
  content_html_en text,
  meta_title_en text,
  meta_description_en text,
  font_size_en text,
  is_published boolean
);

CREATE INDEX IF NOT EXISTS idx_site_content_versions_key
  ON public.site_content_versions (key, edited_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_content_versions_site_content_id
  ON public.site_content_versions (site_content_id, edited_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_content_versions_edited_by
  ON public.site_content_versions (edited_by, edited_at DESC);

CREATE OR REPLACE FUNCTION public.log_site_content_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.site_content_versions (
      site_content_id, key, operation, edited_by,
      title, content, content_html, meta_title, meta_description, font_size,
      title_en, content_en, content_html_en, meta_title_en, meta_description_en, font_size_en,
      is_published
    ) VALUES (
      OLD.id, OLD.key, 'DELETE', auth.uid(),
      OLD.title, OLD.content, OLD.content_html, OLD.meta_title, OLD.meta_description, OLD.font_size,
      OLD.title_en, OLD.content_en, OLD.content_html_en, OLD.meta_title_en, OLD.meta_description_en, OLD.font_size_en,
      OLD.is_published
    );
    RETURN OLD;
  END IF;

  -- Skip no-op UPDATEs (e.g. upserts that rewrite the same values).
  IF TG_OP = 'UPDATE' AND OLD IS NOT DISTINCT FROM NEW THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.site_content_versions (
    site_content_id, key, operation, edited_by,
    title, content, content_html, meta_title, meta_description, font_size,
    title_en, content_en, content_html_en, meta_title_en, meta_description_en, font_size_en,
    is_published
  ) VALUES (
    NEW.id, NEW.key, TG_OP, auth.uid(),
    NEW.title, NEW.content, NEW.content_html, NEW.meta_title, NEW.meta_description, NEW.font_size,
    NEW.title_en, NEW.content_en, NEW.content_html_en, NEW.meta_title_en, NEW.meta_description_en, NEW.font_size_en,
    NEW.is_published
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_content_versions ON public.site_content;
CREATE TRIGGER trg_site_content_versions
  AFTER INSERT OR UPDATE OR DELETE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION public.log_site_content_version();

-- Versions are immutable from the public API: only the trigger
-- (SECURITY DEFINER) writes; admins read only.
ALTER TABLE public.site_content_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read site_content_versions" ON public.site_content_versions;
CREATE POLICY "Admins read site_content_versions"
  ON public.site_content_versions
  FOR SELECT
  USING (public.current_user_role() = 'admin');

-- No INSERT/UPDATE/DELETE policies — writes only via trigger, which
-- bypasses RLS because it runs as SECURITY DEFINER.

COMMENT ON TABLE public.site_content_versions IS
  'Immutable audit log of every change to public.site_content. Written via trigger. Admin-readable.';
