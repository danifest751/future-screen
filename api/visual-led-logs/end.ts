import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { applyCors, getSupabaseAdmin, handleOptions, toJsonBody } from './_shared';

const schema = z.object({
  session_key: z.string().min(8).max(120),
  summary: z.record(z.any()).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return;
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const parsed = schema.safeParse(toJsonBody(req.body));
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.errors });
    }
    const { session_key, summary } = parsed.data;
    const supabase = getSupabaseAdmin();

    const { data: session, error: sessionError } = await supabase
      .from('visual_led_sessions')
      .select('id, started_at')
      .eq('session_key', session_key)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session?.id) return res.status(200).json({ ok: true, skipped: true });

    const startedAt = new Date(session.started_at).getTime();
    const now = Date.now();
    const durationSec = Number.isFinite(startedAt) ? Math.max(0, Math.round((now - startedAt) / 1000)) : null;

    const { error } = await supabase
      .from('visual_led_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_sec: durationSec,
        summary: summary ?? {},
      })
      .eq('id', session.id);
    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[visual-led-logs/end] error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
