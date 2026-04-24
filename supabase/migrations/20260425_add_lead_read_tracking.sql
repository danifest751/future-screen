ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

CREATE INDEX IF NOT EXISTS leads_unread_idx
  ON public.leads (created_at DESC)
  WHERE deleted_at IS NULL AND read_at IS NULL;

COMMENT ON COLUMN public.leads.read_at IS
  'When an admin marked the lead as read in the admin workspace.';
