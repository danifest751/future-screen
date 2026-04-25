-- Wave 2 hotfix follow-up: remove the legacy "Anon insert media_items (bot)"
-- policy that survived the wave-1 reconcile.
--
-- Background: that policy was written when telegram-webhook still had an
-- anon-key fallback path. server/lib/telegramWebhook/supabaseClient.ts has
-- since been hardened to require SUPABASE_SERVICE_ROLE_KEY (anon fallback
-- was removed). service_role bypasses RLS entirely, so the bot does not
-- need any policy — yet the anon INSERT one was left behind with
-- with_check = true, allowing any unauthenticated visitor to upload
-- arbitrary rows into media_items via the public anon key.
--
-- Also drop the redundant "Service role manage media_items" policy: it is
-- a no-op (service_role bypasses RLS), and keeping it around obscures the
-- real surface.

DROP POLICY IF EXISTS "Anon insert media_items (bot)" ON public.media_items;
DROP POLICY IF EXISTS "Service role manage media_items" ON public.media_items;
