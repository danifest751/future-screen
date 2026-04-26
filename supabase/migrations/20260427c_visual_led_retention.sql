-- visual_led_events grows unbounded today: each session can push hundreds
-- of events (move, drag, assist apply, etc.) and we never clean up.
-- After enough months the admin session-detail page (loads all events for
-- a session into the browser) becomes a 50k-row tarpit, and Supabase
-- backups balloon for content nobody looks at.
--
-- This migration:
--   1) Defines a SECURITY DEFINER function purge_visual_led_events(days)
--      that deletes events older than N days. Default 90.
--   2) Schedules it nightly at 03:30 UTC via pg_cron when that extension
--      is available (Supabase free tier may not have it — the schedule is
--      wrapped in a DO block so the migration still applies).
--
-- Idempotent: re-runnable.

CREATE OR REPLACE FUNCTION public.purge_visual_led_events(days_to_keep integer DEFAULT 90)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed bigint;
BEGIN
  IF days_to_keep IS NULL OR days_to_keep < 1 THEN
    RAISE EXCEPTION 'days_to_keep must be >= 1';
  END IF;

  DELETE FROM public.visual_led_events
  WHERE ts < now() - make_interval(days => days_to_keep);

  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_visual_led_events(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_visual_led_events(integer) TO postgres;

COMMENT ON FUNCTION public.purge_visual_led_events(integer) IS
  'Deletes visual_led_events older than the given retention window (default 90 days). Used by the nightly cron and admin "purge" buttons.';

-- Schedule the nightly purge if pg_cron is available. Wrapped in DO so the
-- migration succeeds on environments where the extension is not installed
-- (e.g. local supabase-cli instances without cron). On Supabase Cloud
-- pg_cron is preinstalled — the schedule will be created.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Drop any prior version of this job (idempotent re-run).
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'purge_visual_led_events_daily';

    PERFORM cron.schedule(
      'purge_visual_led_events_daily',
      '30 3 * * *',
      $cron$ SELECT public.purge_visual_led_events(90); $cron$
    );
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  -- Local/role lacks cron schema access — that's fine, deploy will run
  -- without scheduling and the function can still be called manually.
  RAISE NOTICE 'pg_cron present but current role cannot schedule; skipped';
END;
$$;
