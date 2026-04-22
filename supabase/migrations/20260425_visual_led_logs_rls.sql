-- RLS for visual_led_* tables.
-- Context: the visualizer writes to these via /api/visual-led-logs with a
-- service-role key (RLS bypassed on purpose — writes are public-facing).
-- READ access must be admin-only. Adding explicit RLS as defence-in-depth
-- so even if a future refactor uses the anon/authenticated key to read
-- directly (e.g. from React Query + supabase.from), only admins succeed.

ALTER TABLE public.visual_led_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_led_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_led_assets ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT on sessions.
DROP POLICY IF EXISTS "Admins read visual_led_sessions" ON public.visual_led_sessions;
CREATE POLICY "Admins read visual_led_sessions"
  ON public.visual_led_sessions
  FOR SELECT
  USING (public.current_user_role() = 'admin');

-- Admin-only SELECT on events.
DROP POLICY IF EXISTS "Admins read visual_led_events" ON public.visual_led_events;
CREATE POLICY "Admins read visual_led_events"
  ON public.visual_led_events
  FOR SELECT
  USING (public.current_user_role() = 'admin');

-- Admin-only SELECT on assets.
DROP POLICY IF EXISTS "Admins read visual_led_assets" ON public.visual_led_assets;
CREATE POLICY "Admins read visual_led_assets"
  ON public.visual_led_assets
  FOR SELECT
  USING (public.current_user_role() = 'admin');

-- No INSERT/UPDATE/DELETE policies on any of these tables: all writes
-- continue through the service-role API (which bypasses RLS). That way
-- public anonymous visualizer submissions keep working, while the UI
-- read path respects admin-only RLS.
