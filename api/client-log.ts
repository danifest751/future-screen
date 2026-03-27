import type { VercelRequest, VercelResponse } from '@vercel/node';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://future-screen.ru,https://future-screen.vercel.app,http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

// Rate limiting config (client-log менее критичен, поэтому более мягкие лимиты)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 минута
const RATE_LIMIT_MAX = 30; // 30 запросов в минуту
const requestsByIp = new Map<string, number[]>();

const isOriginAllowed = (origin?: string) => {
  if (!origin) return true;
  const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
  const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, '').toLowerCase());
  return normalizedAllowed.includes(normalizedOrigin);
};

const getClientIp = (req: VercelRequest): string => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return value?.split(',')[0]?.trim() || 'unknown';
};

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const attempts = (requestsByIp.get(ip) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  if (attempts.length >= RATE_LIMIT_MAX) {
    requestsByIp.set(ip, attempts);
    return true;
  }
  attempts.push(now);
  requestsByIp.set(ip, attempts);
  return false;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;

  if (!isOriginAllowed(origin)) {
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

  // Rate limiting check
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Too many requests' });
  }

  try {
    const payload = req.body || {};
    
    // Log to console (will appear in Vercel logs)
    console.log('[CLIENT_ERROR]', JSON.stringify({
      timestamp: new Date().toISOString(),
      level: payload.level || 'error',
      message: payload.message || 'Unknown error',
      stack: payload.stack || null,
      url: payload.url || null,
      userAgent: payload.userAgent || null,
    }));

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[CLIENT_LOG_ERROR]', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
