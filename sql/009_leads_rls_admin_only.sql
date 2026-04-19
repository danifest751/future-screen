-- PR #5b: tighten RLS on public.leads + soft-delete.
--
-- Context:
-- Original policies (supabase/migrations/20260220_setup_leads_storage.sql):
--   "Allow anonymous inserts"        — anyone could INSERT (used by the
--                                     browser via the anon key)
--   "Allow authenticated full access" — ANY logged-in user could read,
--                                     update, and DELETE every lead
--
-- Both are too permissive:
--   - anon INSERT lets anyone dump arbitrary PII rows into the table,
--     bypassing validation and rate-limit. Closed by PR #5a (server is
--     now the sole INSERT path via service role, which bypasses RLS).
--   - "authenticated full access" lets a registered viewer/editor read
--     all customer PII and hard-delete the whole table. After PR #4
--     we have an RBAC role in app_metadata — gate on that instead.
--
-- This migration:
--   1. Drops the two legacy policies.
--   2. Adds a deleted_at column for soft-delete. DELETE is no longer the
--      normal path — the admin UI uses UPDATE SET deleted_at = now().
--   3. Installs admin-only policies for SELECT/UPDATE/DELETE. INSERT has
--      NO policy at all, so only the service role (used by api/send.ts)
--      can create rows. This is intentional — the public form goes
--      through the server, and no client path should insert leads.
--
-- Idempotent: safe to re-run (DROP IF EXISTS, ADD COLUMN IF NOT EXISTS,
-- CREATE POLICY is not IF-NOT-EXISTS so we DROP before CREATE).
--
-- Prerequisite: deploy PR #5a first. Applying this migration before
-- #5a is in production will break public form submission because the
-- browser will still try to INSERT via anon and hit RLS.

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.leads;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS leads_deleted_at_idx
  ON public.leads (deleted_at)
  WHERE deleted_at IS NULL;

DROP POLICY IF EXISTS "Admin can read leads"   ON public.leads;
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

-- DELETE is kept for the service role / manual cleanup scripts only;
-- the admin UI should UPDATE deleted_at instead. Admin role is allowed
-- hard-delete as an escape hatch (e.g. GDPR erasure).
CREATE POLICY "Admin can delete leads"
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

COMMENT ON COLUMN public.leads.deleted_at IS
  'Soft-delete marker. NULL = live row. Admin UI clears leads by setting '
  'this instead of hard-deleting, so entries remain recoverable.';
