-- Retention for shared visual-led reports.
--
-- Reports are generated HTML snapshots and can be large. Keep them for a
-- bounded period, delete expired rows nightly when pg_cron is available, and
-- expose a manual SECURITY DEFINER purge function for environments without
-- cron scheduling.

ALTER TABLE public.shared_reports
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

UPDATE public.shared_reports
SET expires_at = created_at + interval '30 days'
WHERE expires_at IS NULL;

ALTER TABLE public.shared_reports
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days'),
  ALTER COLUMN expires_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS shared_reports_expires_at_idx
  ON public.shared_reports (expires_at);

CREATE OR REPLACE FUNCTION public.purge_expired_shared_reports()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed bigint;
BEGIN
  DELETE FROM public.shared_reports
  WHERE expires_at < now();

  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_shared_reports() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_shared_reports() TO postgres;

COMMENT ON COLUMN public.shared_reports.expires_at IS
  'TTL boundary for generated report HTML. Default retention: 30 days.';
COMMENT ON FUNCTION public.purge_expired_shared_reports() IS
  'Deletes shared_reports rows whose expires_at is in the past.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'purge_expired_shared_reports_daily';

    PERFORM cron.schedule(
      'purge_expired_shared_reports_daily',
      '45 3 * * *',
      $cron$ SELECT public.purge_expired_shared_reports(); $cron$
    );
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'pg_cron present but current role cannot schedule; skipped';
END;
$$;

