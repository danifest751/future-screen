ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS request_id TEXT,
  ADD COLUMN IF NOT EXISTS delivery_log JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS page_path TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT;

UPDATE public.leads
SET delivery_log = '[]'::jsonb
WHERE delivery_log IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS leads_request_id_key
  ON public.leads (request_id)
  WHERE request_id IS NOT NULL;
