import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, ensureAdmin, getSupabaseAdmin, handleOptions } from './_shared';

const parsePositiveInt = (value: unknown, fallback: number, max: number) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.min(max, Math.floor(num));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return;
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await ensureAdmin(req);
    const supabase = getSupabaseAdmin();
    const limit = parsePositiveInt(req.query.limit, 50, 200);
    const offset = parsePositiveInt(req.query.offset, 0, 5000);
    const from = offset;
    const to = offset + limit - 1;

    const { data, error, count } = await supabase
      .from('visual_led_sessions')
      .select(
        'id, session_key, started_at, ended_at, duration_sec, page_url, referrer, client_ip, user_agent, timezone, is_admin, summary',
        { count: 'exact' },
      )
      .order('started_at', { ascending: false })
      .range(from, to);
    if (error) throw error;

    return res.status(200).json({
      ok: true,
      items: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const unauthorized = message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('forbidden');
    if (unauthorized) {
      return res.status(403).json({ error: message });
    }
    console.error('[visual-led-logs/sessions] error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
