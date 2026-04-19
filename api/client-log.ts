import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { checkRateLimit } from './_lib/rateLimit.js';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://future-screen.ru,https://future-screen.vercel.app,http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

// Zod схема валидации
const ClientLogSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug']).default('error'),
  message: z.string().min(1).max(1000),
  stack: z.string().max(5000).optional().nullable(),
  url: z.string().url().max(2000).optional().nullable(),
  userAgent: z.string().max(500).optional().nullable(),
  meta: z.record(z.unknown()).optional().nullable(),
});

type ClientLogPayload = z.infer<typeof ClientLogSchema>;

// H8: require Origin on state-changing methods — empty Origin would
// otherwise be an easy CORS bypass for non-browser clients.
const isOriginAllowed = (origin: string | undefined, requireOrigin: boolean): boolean => {
  if (!origin) return !requireOrigin;
  const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
  const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, '').toLowerCase());
  return normalizedAllowed.includes(normalizedOrigin);
};

const getClientIp = (req: VercelRequest): string => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return value?.split(',')[0]?.trim() || 'unknown';
};

const sanitizeLogPayload = (payload: unknown): { valid: boolean; data?: ClientLogPayload; errors?: string[] } => {
  try {
    const result = ClientLogSchema.safeParse(payload);
    if (result.success) {
      return { valid: true, data: result.data };
    }
    return {
      valid: false,
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  } catch {
    return { valid: false, errors: ['Invalid payload structure'] };
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const methodRequiresOrigin = req.method === 'POST' || req.method === 'OPTIONS';

  if (!isOriginAllowed(origin, methodRequiresOrigin)) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  // CORS headers
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  const rl = await checkRateLimit('clientLog', ip);
  if (!rl.allowed) {
    res.setHeader('Retry-After', Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000)).toString());
    return res.status(429).json({ ok: false, error: 'Too many requests' });
  }

  // Validate input
  const validation = sanitizeLogPayload(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      ok: false,
      error: 'Validation failed',
      errors: validation.errors,
    });
  }

  const payload = validation.data!;

  try {
    // Log to console (will appear in Vercel logs)
    console.log('[CLIENT_ERROR]', JSON.stringify({
      timestamp: new Date().toISOString(),
      level: payload.level,
      message: payload.message,
      stack: payload.stack || null,
      url: payload.url || null,
      userAgent: payload.userAgent || null,
      meta: payload.meta || null,
    }));

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[CLIENT_LOG_ERROR]', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
