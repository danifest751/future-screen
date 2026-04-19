-- Reconcile RBAC/RLS policies after security hardening.
--
-- Why this migration exists:
-- 1) Early migrations created permissive policies (authenticated/full-access).
-- 2) Later hardening SQL scripts in /sql tightened rules, but fresh environments
--    that apply only supabase/migrations could still keep legacy policies.
-- 3) We standardize everything here to trusted app_metadata role checks via
--    public.current_user_role().
--
-- Scope:
-- - public.current_user_role() helper (trusted app_metadata only)
-- - site_settings: public read, admin write
-- - site_content: public read published, admin read/write/delete all
-- - leads: admin read/update/delete only, no INSERT policy for anon/authenticated
--
-- Safe to re-run: all policy operations use DROP IF EXISTS + CREATE.

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

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------
-- site_settings policies
-- --------------------------------------------
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow authenticated users to read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admins to read site_settings" ON public.site_settings;

DROP POLICY IF EXISTS "Admin update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admins to update site_settings" ON public.site_settings;

DROP POLICY IF EXISTS "Admin insert site_settings" ON public.site_settings;
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

-- --------------------------------------------
-- site_content policies
-- --------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read site_content" ON public.site_content;
DROP POLICY IF EXISTS "Allow authenticated users to read site_content" ON public.site_content;
DROP POLICY IF EXISTS "Public read published site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admin read all site_content" ON public.site_content;

DROP POLICY IF EXISTS "Authenticated users can update site_content" ON public.site_content;
DROP POLICY IF EXISTS "Allow admins to update site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admin update site_content" ON public.site_content;

DROP POLICY IF EXISTS "Allow admins to insert site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admin insert site_content" ON public.site_content;

DROP POLICY IF EXISTS "Authenticated users can delete site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admin delete site_content" ON public.site_content;

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

-- --------------------------------------------
-- leads policies
-- --------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS leads_deleted_at_idx
  ON public.leads (deleted_at)
  WHERE deleted_at IS NULL;

DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.leads;

DROP POLICY IF EXISTS "Admin can read leads" ON public.leads;
DROP POLICY IF EXISTS "Admin can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admin can delete leads" ON public.leads;

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
