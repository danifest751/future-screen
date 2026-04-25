import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { checkRateLimit } from '../_lib/rateLimit.js';

// Match the dedicated /api/visual-led/upload-background endpoint so the
// two background-upload paths can't be played against each other.
const MAX_DATA_URL_BYTES = 10 * 1024 * 1024;
const ALLOWED_UPLOAD_MIME = /^image\/(png|jpe?g|webp)$/i;

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'https://future-screen.ru,https://future-screen.vercel.app,http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const bucket = 'visual-led-backgrounds';

let supabaseAdmin: SupabaseClient | null = null;

// Клиент (public/visual-led/index.html) шлёт `null` для пустых опциональных
// полей (e.g. document.referrer || null, activeScene()?.id || null). Zod
// `.optional()` = `T | undefined`, null ломает схему. Поэтому
// `.nullable().optional()` — принимаем оба.
const startSchema = z.object({
  session_key: z.string().min(8).max(120),
  page_url: z.string().max(1000).nullable().optional(),
  referrer: z.string().max(1000).nullable().optional(),
  utm: z.record(z.string()).nullable().optional(),
  timezone: z.string().max(120).nullable().optional(),
  viewport: z.record(z.any()).nullable().optional(),
  screen: z.record(z.any()).nullable().optional(),
  device: z.record(z.any()).nullable().optional(),
  is_admin: z.boolean().nullable().optional(),
  admin_user_id: z.string().uuid().nullable().optional(),
});

const eventSchema = z.object({
  event_type: z.string().min(1).max(120),
  ts: z.string().nullable().optional(),
  scene_id: z.string().max(120).nullable().optional(),
  screen_id: z.string().max(120).nullable().optional(),
  payload: z.record(z.any()).nullable().optional(),
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

type UserRole = 'admin' | 'editor' | 'viewer';

function parseRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'admin' || normalized === 'editor' || normalized === 'viewer') {
    return normalized;
  }
  return null;
}

function resolveRole(user: User): UserRole {
  // Trusted RBAC source: app_metadata only. user_metadata is user-writable.
  const candidates: unknown[] = [
    user.app_metadata?.role,
    user.app_metadata?.user_role,
    (user.app_metadata as { claims?: { role?: unknown } } | null)?.claims?.role,
  ];

  if (candidates.some((candidate) => parseRole(candidate) === 'admin')) return 'admin';
  if (candidates.some((candidate) => parseRole(candidate) === 'editor')) return 'editor';
  return 'viewer';
}

function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = String(req.headers.origin || '').replace(/\/$/, '');
  const normalizedAllowed = allowedOrigins.map((item) => item.replace(/\/$/, '').toLowerCase());
  const normalizedOrigin = origin.toLowerCase();
  // Reject when:
  //   - Origin is set but not in the allow-list, OR
  //   - method is a write (POST/OPTIONS) and Origin is missing entirely
  //     (curl / non-browser callers shouldn't be able to write).
  const isWrite = req.method === 'POST' || req.method === 'OPTIONS';
  if (origin && !normalizedAllowed.includes(normalizedOrigin)) {
    res.status(403).json({ error: 'Forbidden origin' });
    return false;
  }
  if (!origin && isWrite) {
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
  const role = resolveRole(data.user);
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

      // Rate-limit shared with the dedicated upload endpoint — both paths
      // hit the same Storage bucket and quota.
      const ip = ((): string => {
        const forwarded = req.headers['x-forwarded-for'];
        const raw = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '');
        return raw.split(',')[0]?.trim() || 'unknown';
      })();
      const rl = await checkRateLimit('visualLedSave', ip);
      if (!rl.allowed) {
        res.setHeader('Retry-After', Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000)).toString());
        return res.status(429).json({ error: 'Too many uploads, try again later' });
      }

      const parsed = uploadSchema.safeParse(toJsonBody(req.body));
      if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.errors });
      const payload = parsed.data;

      // Cheap pre-check on the raw data_url string before base64-decoding.
      // base64 expands ~33%, so the budget for the resulting buffer is 4/3 of
      // MAX_DATA_URL_BYTES. Without this an attacker could ship 50MB of
      // base64 and we'd allocate the full Buffer before catching it.
      if (payload.data_url.length > MAX_DATA_URL_BYTES * 1.4) {
        return res.status(413).json({ error: 'Upload too large', maxBytes: MAX_DATA_URL_BYTES });
      }

      const parsedUrl = parseDataUrl(payload.data_url);
      if (parsedUrl.buffer.length > MAX_DATA_URL_BYTES) {
        return res.status(413).json({ error: 'Upload too large', maxBytes: MAX_DATA_URL_BYTES });
      }

      const mimeType = payload.mime_type || parsedUrl.mime || 'image/jpeg';
      if (!ALLOWED_UPLOAD_MIME.test(mimeType)) {
        return res.status(400).json({ error: 'Unsupported MIME type', mime: mimeType });
      }

      const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
      const safeName = sanitizeStorageName(payload.file_name.replace(/\.[^.]+$/, ''));
      // Cryptographic random suffix (vs Date.now()) so two near-simultaneous
      // uploads from different sessions can't collide on the same path.
      const suffix = randomBytes(8).toString('hex');
      const storagePath = `${payload.session_key}/${suffix}-${safeName}.${ext}`;

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

      const assetsWithPreview = await Promise.all(
        (assets ?? []).map(async (asset) => {
          try {
            const { data: signedData } = await supabase.storage
              .from(asset.storage_bucket)
              .createSignedUrl(asset.storage_path, 60 * 60);

            return {
              ...asset,
              preview_url: signedData?.signedUrl || null,
            };
          } catch {
            return {
              ...asset,
              preview_url: null,
            };
          }
        }),
      );

      return res.status(200).json({
        ok: true,
        session,
        events: events ?? [],
        assets: assetsWithPreview,
      });
    }

    if (action === 'session-delete') {
      if (req.method !== 'POST' && req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      await ensureAdmin(req);
      const body = toJsonBody<{ id?: string }>(req.body);
      const sessionId = String(req.query.id || body.id || '').trim();
      if (!sessionId) return res.status(400).json({ error: 'Missing session id' });

      // Gather asset storage paths first — we need them to clean up the bucket
      // before the DB rows disappear.
      const { data: assetsToDelete, error: assetsFetchError } = await supabase
        .from('visual_led_assets')
        .select('storage_bucket, storage_path')
        .eq('session_id', sessionId);
      if (assetsFetchError) throw assetsFetchError;

      // Group paths by bucket (future-proof even though all uploads go to
      // `visual-led-backgrounds` today).
      const byBucket = new Map<string, string[]>();
      for (const asset of assetsToDelete ?? []) {
        const paths = byBucket.get(asset.storage_bucket) ?? [];
        paths.push(asset.storage_path);
        byBucket.set(asset.storage_bucket, paths);
      }
      for (const [bucketName, paths] of byBucket.entries()) {
        if (paths.length === 0) continue;
        const { error: removeError } = await supabase.storage.from(bucketName).remove(paths);
        if (removeError) {
          // Storage cleanup best-effort: log and continue, don't block DB delete.
          console.warn('[visual-led-logs] storage remove failed', bucketName, removeError.message);
        }
      }

      // DB cleanup — rely on ON DELETE CASCADE if set, otherwise explicit.
      const { error: eventsDeleteError } = await supabase
        .from('visual_led_events')
        .delete()
        .eq('session_id', sessionId);
      if (eventsDeleteError) throw eventsDeleteError;

      const { error: assetsDeleteError } = await supabase
        .from('visual_led_assets')
        .delete()
        .eq('session_id', sessionId);
      if (assetsDeleteError) throw assetsDeleteError;

      const { error: sessionDeleteError } = await supabase
        .from('visual_led_sessions')
        .delete()
        .eq('id', sessionId);
      if (sessionDeleteError) throw sessionDeleteError;

      return res.status(200).json({
        ok: true,
        deleted: {
          session_id: sessionId,
          assets_removed: (assetsToDelete ?? []).length,
        },
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
