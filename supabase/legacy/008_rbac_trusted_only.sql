-- PR #4c: drop the user_metadata branch from the RBAC helper.
--
-- Context: sql/006_rbac_dual_read.sql introduced public.current_user_role()
-- with a transitional COALESCE that also read from user_metadata. That was
-- the dual-read phase — safe for migration but still allows a user to
-- self-promote via supabase.auth.updateUser() if they land in the fallback
-- branch.
--
-- After PR #4b confirmed every existing user has app_metadata.role set
-- (Total:1, Already OK:1, Backfilled:0 — see run on 2026-04-19), the
-- fallback is no longer load-bearing. Replace the function so only the
-- trusted app_metadata source is consulted.
--
-- Idempotent: safe to re-run.

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
  'Returns the caller''s role from JWT app_metadata. user_metadata is '
  'intentionally NOT consulted — it is user-writable and thus untrusted. '
  'Defaults to viewer if no role is set.';
