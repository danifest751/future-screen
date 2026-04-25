// POST /api/visual-led/save
// Принимает state визуализатора, кладёт в visual_led_projects (service_role),
// возвращает UUID для share-ссылки /visual-led?project=<id>.
//
// Анонимно. Rate-limit через Upstash (20 сохранений / 10 мин на IP).
// Размер payload ограничен ~512KB, чтобы не забить Supabase JSONB мусором.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '../_lib/rateLimit.js';
import { applyCors } from '../_lib/cors.js';

const MAX_STATE_BYTES = 512 * 1024;

const payloadSchema = z.object({
  state: z.record(z.any()),
});

let supabaseAdmin: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabaseAdmin) return supabaseAdmin;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing for visual-led/save');
  supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
  return supabaseAdmin;
}

function toJsonBody(body: unknown): unknown {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body ?? {};
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '');
  const first = raw.split(',')[0]?.trim();
  return first || 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cors = applyCors(req, res, { methods: 'POST, OPTIONS' });
  if (cors === 'reject') return res.status(403).json({ error: 'Forbidden origin' });
  if (cors === 'preflight') return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIp(req);
  const rl = await checkRateLimit('visualLedSave', ip);
  if (!rl.allowed) {
    res.setHeader('Retry-After', Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000)).toString());
    return res.status(429).json({ error: 'Too many saves, try again later' });
  }

  const parsed = payloadSchema.safeParse(toJsonBody(req.body));
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.errors });
  }

  const serialized = JSON.stringify(parsed.data.state);
  if (serialized.length > MAX_STATE_BYTES) {
    return res.status(413).json({
      error: 'State too large',
      maxBytes: MAX_STATE_BYTES,
      receivedBytes: serialized.length,
    });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('visual_led_projects')
      .insert({ state: parsed.data.state })
      .select('id, created_at')
      .single();

    if (error) throw error;
    return res.status(200).json({ ok: true, id: data.id, createdAt: data.created_at });
  } catch (err) {
    console.error('[visual-led/save] error', err);
    return res.status(500).json({ error: 'Failed to save project' });
  }
}
