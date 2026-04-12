import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { applyCors, getSupabaseAdmin, handleOptions, toJsonBody } from './_shared';

const eventSchema = z.object({
  event_type: z.string().min(1).max(120),
  ts: z.string().optional(),
  scene_id: z.string().max(120).optional(),
  screen_id: z.string().max(120).optional(),
  payload: z.record(z.any()).optional(),
});

const schema = z.object({
  session_key: z.string().min(8).max(120),
  events: z.array(eventSchema).min(1).max(200),
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
    const { session_key, events } = parsed.data;
    const supabase = getSupabaseAdmin();

    let sessionId: string | null = null;
    const { data: existing, error: existingError } = await supabase
      .from('visual_led_sessions')
      .select('id')
      .eq('session_key', session_key)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing?.id) {
      sessionId = existing.id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('visual_led_sessions')
        .insert({ session_key, started_at: new Date().toISOString() })
        .select('id')
        .single();
      if (insertError) throw insertError;
      sessionId = inserted.id;
    }

    const rows = events.map((event) => ({
      session_id: sessionId,
      ts: event.ts ? new Date(event.ts).toISOString() : new Date().toISOString(),
      event_type: event.event_type,
      scene_id: event.scene_id || null,
      screen_id: event.screen_id || null,
      payload: event.payload ?? {},
    }));

    const { error } = await supabase.from('visual_led_events').insert(rows);
    if (error) throw error;

    return res.status(200).json({ ok: true, inserted: rows.length });
  } catch (error) {
    console.error('[visual-led-logs/event-batch] error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
