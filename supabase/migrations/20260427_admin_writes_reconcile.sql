-- Wave 2 hotfix: tighten write policies on tables that still grant ALL
-- access to any authenticated session. Same shape as the wave-0 cleanup
-- (20260420174000_policy_drift_cleanup), but for the catalog/media/legacy
-- tables that were missed.
--
-- Problem: 20260403_media_library and 001_create_rental_categories applied
-- `FOR ALL USING (auth.role() = 'authenticated')`. Any non-admin token
-- (viewer, editor, leftover demo accounts) can wipe the media library or
-- rewrite rental category copy. We've also been running 010_visual_led_projects
-- straight from supabase/legacy/, so it lives outside the canonical migration
-- chain — promote it here with explicit "writes only via service_role".
--
-- Idempotent: every CREATE is preceded by a DROP, so the script is safe
-- to re-run.

-- ------------------------------------------------------------
-- media_items — admin manage only
-- ------------------------------------------------------------
ALTER TABLE IF EXISTS public.media_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read media_items" ON public.media_items;
DROP POLICY IF EXISTS "Admin manage media_items" ON public.media_items;
DROP POLICY IF EXISTS "Admin insert media_items" ON public.media_items;
DROP POLICY IF EXISTS "Admin update media_items" ON public.media_items;
DROP POLICY IF EXISTS "Admin delete media_items" ON public.media_items;

CREATE POLICY "Public read media_items"
  ON public.media_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin insert media_items"
  ON public.media_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Admin update media_items"
  ON public.media_items
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Admin delete media_items"
  ON public.media_items
  FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- ------------------------------------------------------------
-- case_media_links — admin manage only
-- ------------------------------------------------------------
ALTER TABLE IF EXISTS public.case_media_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read case_media_links" ON public.case_media_links;
DROP POLICY IF EXISTS "Admin manage case_media_links" ON public.case_media_links;
DROP POLICY IF EXISTS "Admin insert case_media_links" ON public.case_media_links;
DROP POLICY IF EXISTS "Admin update case_media_links" ON public.case_media_links;
DROP POLICY IF EXISTS "Admin delete case_media_links" ON public.case_media_links;

CREATE POLICY "Public read case_media_links"
  ON public.case_media_links
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin insert case_media_links"
  ON public.case_media_links
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Admin update case_media_links"
  ON public.case_media_links
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Admin delete case_media_links"
  ON public.case_media_links
  FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- ------------------------------------------------------------
-- rental_categories — admin manage only
-- (legacy 001_create_rental_categories.sql granted FOR ALL to any
--  authenticated session)
-- ------------------------------------------------------------
ALTER TABLE IF EXISTS public.rental_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rental_categories_public_read" ON public.rental_categories;
DROP POLICY IF EXISTS "rental_categories_admin_all" ON public.rental_categories;
DROP POLICY IF EXISTS "Admin insert rental_categories" ON public.rental_categories;
DROP POLICY IF EXISTS "Admin update rental_categories" ON public.rental_categories;
DROP POLICY IF EXISTS "Admin delete rental_categories" ON public.rental_categories;

CREATE POLICY "rental_categories_public_read"
  ON public.rental_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin insert rental_categories"
  ON public.rental_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Admin update rental_categories"
  ON public.rental_categories
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Admin delete rental_categories"
  ON public.rental_categories
  FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- ------------------------------------------------------------
-- visual_led_projects — promote from supabase/legacy/010 into the
-- canonical migration chain. Public reads are intentional (anyone with
-- the share UUID can read), writes only via service_role.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.visual_led_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS visual_led_projects_created_at_idx
  ON public.visual_led_projects (created_at DESC);

ALTER TABLE public.visual_led_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read visual_led_projects" ON public.visual_led_projects;

CREATE POLICY "Public read visual_led_projects"
  ON public.visual_led_projects
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies for anon/authenticated — server only
-- writes via service_role from api/visual-led/save.ts. Rate-limit lives
-- in that handler.

COMMENT ON TABLE public.visual_led_projects IS
  'Public share-link projects for the LED visualizer. Read by UUID; writes are service_role only.';
