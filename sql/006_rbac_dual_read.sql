-- PR #4a: RBAC dual-read migration.
--
-- Context: CODE_REVIEW finding C2 — reading role from user_metadata allows any
-- authenticated user to self-promote to admin via supabase.auth.updateUser().
-- The trusted source is app_metadata (server-only; cannot be updated by user).
--
-- This migration keeps BOTH sources readable so that deployment does not lock
-- out admins whose role is currently only in user_metadata. After the backfill
-- script in PR #4b has copied every role into app_metadata, PR #4c drops the
-- user_metadata branch entirely.
--
-- Idempotent: safe to re-run.

-- Helper: returns 'admin' if either metadata source says so. Prefer app_metadata.
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
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'viewer'
  );
$$;

-- Replace site_settings policies to use the helper.
DROP POLICY IF EXISTS "Allow admins to update site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow admins to insert site_settings" ON site_settings;

CREATE POLICY "Allow admins to update site_settings"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Allow admins to insert site_settings"
  ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

-- Same for site_content.
DROP POLICY IF EXISTS "Allow admins to update site_content" ON site_content;
DROP POLICY IF EXISTS "Allow admins to insert site_content" ON site_content;

CREATE POLICY "Allow admins to update site_content"
  ON site_content
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Allow admins to insert site_content"
  ON site_content
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');
