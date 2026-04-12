import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { applyCors, getSupabaseAdmin, handleOptions, toJsonBody } from './_shared';

const schema = z.object({
  session_key: z.string().min(8).max(120),
  page_url: z.string().max(1000).optional(),
  referrer: z.string().max(1000).optional(),
  utm: z.record(z.string()).optional(),
  timezone: z.string().max(120).optional(),
  viewport: z.record(z.any()).optional(),
  screen: z.record(z.any()).optional(),
  device: z.record(z.any()).optional(),
  is_admin: z.boolean().optional(),
  admin_user_id: z.string().uuid().optional(),
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

    const payload = parsed.data;
    const supabase = getSupabaseAdmin();
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp = Array.isArray(forwardedFor) ? forwardedFor[0] : String(forwardedFor || '').split(',')[0]?.trim() || null;
    const userAgent = String(req.headers['user-agent'] || '');
    const acceptLanguage = String(req.headers['accept-language'] || '');

    const { data, error } = await supabase
      .from('visual_led_sessions')
      .upsert(
        {
          session_key: payload.session_key,
          page_url: payload.page_url || null,
          referrer: payload.referrer || null,
          utm: payload.utm ?? {},
          timezone: payload.timezone || null,
          viewport: payload.viewport ?? {},
          screen: payload.screen ?? {},
          device: payload.device ?? {},
          is_admin: payload.is_admin ?? false,
          admin_user_id: payload.admin_user_id ?? null,
          client_ip: clientIp,
          user_agent: userAgent || null,
          accept_language: acceptLanguage || null,
          started_at: new Date().toISOString(),
        },
        { onConflict: 'session_key' },
      )
      .select('id, session_key, started_at')
      .single();

    if (error) throw error;
    return res.status(200).json({ ok: true, session: data });
  } catch (error) {
    console.error('[visual-led-logs/start] error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
