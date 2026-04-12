import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { z } from 'zod';

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'https://future-screen.ru,https://future-screen.vercel.app,http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const bucket = 'visual-led-backgrounds';

let supabaseAdmin: SupabaseClient | null = null;

const startSchema = z.object({
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

const eventSchema = z.object({
  event_type: z.string().min(1).max(120),
  ts: z.string().optional(),
  scene_id: z.string().max(120).optional(),
  screen_id: z.string().max(120).optional(),
  payload: z.record(z.any()).optional(),
});

const eventBatchSchema = z.object({
  session_key: z.string().min(8).max(120),
  events: z.array(eventSchema).min(1).max(200),
});

const endSchema = z.object({
  session_key: z.string().min(8).max(120),
  summary: z.record(z.any()).optional(),
});

const uploadSchema = z.object({
  session_key: z.string().min(8).max(120),
  file_name: z.string().min(1).max(220),
  mime_type: z.string().min(3).max(120).optional(),
  data_url: z.string().min(64),
  size_bytes: z.number().int().positive().optional(),
  meta: z.record(z.any()).optional(),
});

function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = String(req.headers.origin || '').replace(/\/$/, '');
  const normalizedAllowed = allowedOrigins.map((item) => item.replace(/\/$/, '').toLowerCase());
  const normalizedOrigin = origin.toLowerCase();
  if (origin && !normalizedAllowed.includes(normalizedOrigin)) {
    res.status(403).json({ error: 'Forbidden origin' });
    return false;
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return true;
}

function handleOptions(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

function toJsonBody<T = Record<string, unknown>>(body: unknown): T {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as T;
    } catch {
      return {} as T;
    }
  }
  return (body ?? {}) as T;
}

function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) return supabaseAdmin;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    throw new Error('Supabase env vars are not configured for visual-led log API');
  }
  supabaseAdmin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  return supabaseAdmin;
}

async function ensureAdmin(req: VercelRequest): Promise<User> {
  const auth = String(req.headers.authorization || '');
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error('Unauthorized: missing bearer token');
  const token = match[1];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error('Unauthorized: invalid user token');
  const role = String(data.user.user_metadata?.role || 'viewer');
  if (role !== 'admin') throw new Error('Forbidden: admin role required');
  return data.user;
}

function sanitizeStorageName(fileName: string): string {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'background';
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid data URL');
  return { mime: match[1], buffer: Buffer.from(match[2], 'base64') };
}

const parsePositiveInt = (value: unknown, fallback: number, max: number) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;
  return Math.min(max, Math.floor(num));
};

function getAction(req: VercelRequest): string {
  const raw = req.query.action;
  if (Array.isArray(raw)) return raw[0] || '';
  return String(raw || '').trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return;
  if (handleOptions(req, res)) return;

  const action = getAction(req);

  try {
    const supabase = getSupabaseAdmin();

    if (action === 'start') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const parsed = startSchema.safeParse(toJsonBody(req.body));
      if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.errors });

      const payload = parsed.data;
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
    }

    if (action === 'event-batch') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const parsed = eventBatchSchema.safeParse(toJsonBody(req.body));
      if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.errors });
      const { session_key, events } = parsed.data;

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
    }

    if (action === 'end') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const parsed = endSchema.safeParse(toJsonBody(req.body));
      if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.errors });
      const { session_key, summary } = parsed.data;

      const { data: session, error: sessionError } = await supabase
        .from('visual_led_sessions')
        .select('id, started_at')
        .eq('session_key', session_key)
        .maybeSingle();
      if (sessionError) throw sessionError;
      if (!session?.id) return res.status(200).json({ ok: true, skipped: true });

      const startedAt = new Date(session.started_at).getTime();
      const durationSec = Number.isFinite(startedAt) ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : null;

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
    }

    if (action === 'background-upload') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const parsed = uploadSchema.safeParse(toJsonBody(req.body));
      if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.errors });
      const payload = parsed.data;
      const parsedUrl = parseDataUrl(payload.data_url);
      const mimeType = payload.mime_type || parsedUrl.mime || 'image/jpeg';
      const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
      const safeName = sanitizeStorageName(payload.file_name.replace(/\.[^.]+$/, ''));
      const storagePath = `${payload.session_key}/${Date.now()}-${safeName}.${ext}`;

      const { data: uploaded, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, parsedUrl.buffer, { contentType: mimeType, upsert: false });
      if (uploadError) throw uploadError;

      const { data: session, error: sessionError } = await supabase
        .from('visual_led_sessions')
        .select('id')
        .eq('session_key', payload.session_key)
        .maybeSingle();
      if (sessionError) throw sessionError;

      if (session?.id) {
        const { error: insertError } = await supabase.from('visual_led_assets').insert({
          session_id: session.id,
          asset_type: 'background',
          file_name: payload.file_name,
          mime_type: mimeType,
          size_bytes: payload.size_bytes ?? parsedUrl.buffer.length,
          storage_bucket: bucket,
          storage_path: uploaded.path,
          meta: payload.meta ?? {},
        });
        if (insertError) throw insertError;
      }

      return res.status(200).json({
        ok: true,
        bucket,
        storage_path: uploaded.path,
        session_linked: Boolean(session?.id),
      });
    }

    if (action === 'sessions') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      await ensureAdmin(req);
      const limit = parsePositiveInt(req.query.limit, 50, 200);
      const offset = parsePositiveInt(req.query.offset, 0, 5000);

      const { data, error, count } = await supabase
        .from('visual_led_sessions')
        .select(
          'id, session_key, started_at, ended_at, duration_sec, page_url, referrer, client_ip, user_agent, timezone, is_admin, summary',
          { count: 'exact' },
        )
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;

      return res.status(200).json({
        ok: true,
        items: data ?? [],
        total: count ?? 0,
        limit,
        offset,
      });
    }

    if (action === 'session') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      await ensureAdmin(req);
      const sessionId = String(req.query.id || '').trim();
      if (!sessionId) return res.status(400).json({ error: 'Missing session id' });

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
    }

    return res.status(404).json({ error: 'Unknown action' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('forbidden')) {
      return res.status(403).json({ error: message });
    }
    console.error('[visual-led-logs] error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
