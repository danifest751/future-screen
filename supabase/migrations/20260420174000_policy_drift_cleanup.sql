-- Wave 0 hotfix: clean production policy drift.
--
-- Problem observed in production:
-- - public.leads has permissive legacy policies:
--   * Authenticated read/update/delete leads
--   * Public insert leads with required fields
-- - public.site_content has permissive legacy policy:
--   * Authenticated users can insert site_content
--
-- Impact:
-- - Any authenticated non-admin can access/modify leads.
-- - Anonymous/authenticated users can insert leads directly (bypassing
--   intended server-only insertion path).
-- - Any authenticated user can insert site_content.
--
-- Goal:
-- - enforce canonical hardened RBAC from current_user_role(app_metadata).
-- - keep script idempotent (safe re-run).

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    (auth.jwt() -> 'app_metadata' ->> 'user_role'),
    'viewer'
  );
$$;

COMMENT ON FUNCTION public.current_user_role() IS
  'Returns caller role from JWT app_metadata. user_metadata is intentionally ignored.';

-- ------------------------------------------------------------
-- site_settings canonical policies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin insert site_settings" ON public.site_settings;

DROP POLICY IF EXISTS "Allow authenticated users to read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admins to read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admins to update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admins to insert site_settings" ON public.site_settings;

CREATE POLICY "Public read site_settings"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin update site_settings"
  ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Admin insert site_settings"
  ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

-- ------------------------------------------------------------
-- site_content canonical policies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public read published site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admin read all site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admin update site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admin insert site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admin delete site_content" ON public.site_content;

DROP POLICY IF EXISTS "Anon can read published site_content" ON public.site_content;
DROP POLICY IF EXISTS "Authenticated users can read site_content" ON public.site_content;
DROP POLICY IF EXISTS "Authenticated users can update site_content" ON public.site_content;
DROP POLICY IF EXISTS "Authenticated users can delete site_content" ON public.site_content;
DROP POLICY IF EXISTS "Authenticated users can insert site_content" ON public.site_content;
DROP POLICY IF EXISTS "Allow authenticated users to read site_content" ON public.site_content;
DROP POLICY IF EXISTS "Allow admins to update site_content" ON public.site_content;
DROP POLICY IF EXISTS "Allow admins to insert site_content" ON public.site_content;

CREATE POLICY "Public read published site_content"
  ON public.site_content
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Admin read all site_content"
  ON public.site_content
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Admin update site_content"
  ON public.site_content
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Admin insert site_content"
  ON public.site_content
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Admin delete site_content"
  ON public.site_content
  FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- ------------------------------------------------------------
-- leads canonical policies
-- ------------------------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS leads_deleted_at_idx
  ON public.leads (deleted_at)
  WHERE deleted_at IS NULL;

DROP POLICY IF EXISTS "Admin can read leads" ON public.leads;
DROP POLICY IF EXISTS "Admin can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admin can delete leads" ON public.leads;

DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.leads;
DROP POLICY IF EXISTS "Authenticated read leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated update leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated delete leads" ON public.leads;
DROP POLICY IF EXISTS "Public insert leads with required fields" ON public.leads;

CREATE POLICY "Admin can read leads"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Admin can update leads"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Admin can delete leads"
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');
