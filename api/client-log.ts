import type { VercelRequest, VercelResponse } from '@vercel/node';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://future-screen.ru,https://future-screen.vercel.app,http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

const isOriginAllowed = (origin?: string) => {
  if (!origin) return true;
  const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
  const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, '').toLowerCase());
  return normalizedAllowed.includes(normalizedOrigin);
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
