-- PR #8: CODE_REVIEW H9 — allow anonymous read of published site_content.
--
-- 003_create_site_content.sql restricts SELECT to `authenticated`, but
-- /privacy, /terms and similar pages need to render for logged-out
-- visitors. Without this policy the client anon key gets an empty result
-- set and the page silently 404s (or we bypass RLS with service-role from
-- the client, which would be far worse).
--
-- Scope: only rows where `is_published = true`. Drafts remain invisible.
-- Idempotent; safe to re-run.

-- Grant is additive: keeps the existing "Authenticated users can read"
-- policy so admins can still see drafts. DROP+CREATE keeps this
-- re-runnable on Postgres 15 (Supabase default), which does not support
-- `CREATE POLICY IF NOT EXISTS`.
DROP POLICY IF EXISTS "Anon can read published site_content" ON site_content;
CREATE POLICY "Anon can read published site_content"
    ON site_content FOR SELECT
    TO anon
    USING (is_published IS TRUE);

-- Document the intent in the catalog so a future DBA does not revoke it.
COMMENT ON POLICY "Anon can read published site_content" ON site_content IS
  'Public pages (/privacy, /terms, …) need to render without auth. Only '
  'rows with is_published=true are exposed.';
