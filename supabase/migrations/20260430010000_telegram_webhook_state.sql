-- Persistent state for the Telegram media-upload webhook.
--
-- The server code already reads/writes these tables when the service-role
-- key is available, with an in-memory fallback for local development. This
-- migration makes the production contract explicit and keeps all Telegram
-- webhook state in canonical migrations.

CREATE TABLE IF NOT EXISTS public.telegram_sessions (
  chat_id bigint PRIMARY KEY,
  state text NOT NULL CHECK (state IN ('awaiting_tags', 'awaiting_files', 'awaiting_new_tag')),
  selected_tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  last_activity timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS telegram_sessions_last_activity_idx
  ON public.telegram_sessions (last_activity DESC);

CREATE TABLE IF NOT EXISTS public.telegram_processed_messages (
  message_id bigint PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS telegram_processed_messages_processed_at_idx
  ON public.telegram_processed_messages (processed_at DESC);

CREATE TABLE IF NOT EXISTS public.telegram_tags (
  tag text PRIMARY KEY,
  usage_count integer NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT telegram_tags_not_blank CHECK (length(btrim(tag)) > 0)
);

CREATE INDEX IF NOT EXISTS telegram_tags_usage_idx
  ON public.telegram_tags (usage_count DESC, tag ASC);

CREATE TABLE IF NOT EXISTS public.telegram_stats (
  id bigserial PRIMARY KEY,
  metric text NOT NULL,
  period text NOT NULL CHECK (period IN ('day', 'week', 'month', 'all')),
  period_start timestamptz NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT telegram_stats_metric_not_blank CHECK (length(btrim(metric)) > 0)
);

CREATE INDEX IF NOT EXISTS telegram_stats_lookup_idx
  ON public.telegram_stats (metric, period, period_start DESC);

CREATE OR REPLACE FUNCTION public.touch_telegram_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_telegram_sessions_updated_at ON public.telegram_sessions;
CREATE TRIGGER trg_telegram_sessions_updated_at
BEFORE UPDATE ON public.telegram_sessions
FOR EACH ROW
EXECUTE FUNCTION public.touch_telegram_updated_at();

DROP TRIGGER IF EXISTS trg_telegram_tags_updated_at ON public.telegram_tags;
CREATE TRIGGER trg_telegram_tags_updated_at
BEFORE UPDATE ON public.telegram_tags
FOR EACH ROW
EXECUTE FUNCTION public.touch_telegram_updated_at();

DROP TRIGGER IF EXISTS trg_telegram_stats_updated_at ON public.telegram_stats;
CREATE TRIGGER trg_telegram_stats_updated_at
BEFORE UPDATE ON public.telegram_stats
FOR EACH ROW
EXECUTE FUNCTION public.touch_telegram_updated_at();

ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_processed_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_stats ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.telegram_sessions IS
  'Persistent Telegram upload-flow state. Written by service-role webhook code.';
COMMENT ON TABLE public.telegram_processed_messages IS
  'Telegram message deduplication table for webhook retries.';
COMMENT ON TABLE public.telegram_tags IS
  'Normalized Telegram media-upload tags cache/statistics.';
COMMENT ON TABLE public.telegram_stats IS
  'Aggregated Telegram bot statistics for future admin/reporting use.';
