import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, ensureAdmin, getSupabaseAdmin, handleOptions } from './_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return;
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await ensureAdmin(req);
    const sessionId = String(req.query.id || '').trim();
    if (!sessionId) return res.status(400).json({ error: 'Missing session id' });

    const supabase = getSupabaseAdmin();
    const { data: session, error: sessionError } = await supabase
      .from('visual_led_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { data: events, error: eventsError } = await supabase
      .from('visual_led_events')
      .select('id, ts, event_type, scene_id, screen_id, payload')
      .eq('session_id', sessionId)
      .order('ts', { ascending: true });
    if (eventsError) throw eventsError;

    const { data: assets, error: assetsError } = await supabase
      .from('visual_led_assets')
      .select('id, created_at, asset_type, file_name, mime_type, size_bytes, storage_bucket, storage_path, meta')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    if (assetsError) throw assetsError;

    return res.status(200).json({
      ok: true,
      session,
      events: events ?? [],
      assets: assets ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const unauthorized = message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('forbidden');
    if (unauthorized) return res.status(403).json({ error: message });
    console.error('[visual-led-logs/session] error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
