import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Origin allow-list shared by every Vercel function. Single source of
 * truth so we don't end up with one endpoint that echoes any Origin
 * (the bug 20260427b cleanup chased) and another that's strict.
 *
 * Env var ALLOWED_ORIGINS is a comma-separated list. Defaults match the
 * production + preview + local-dev origins used by the SPA.
 */
export const getAllowedOrigins = (): string[] =>
  (process.env.ALLOWED_ORIGINS ||
    'https://future-screen.ru,https://future-screen.vercel.app,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5000,http://127.0.0.1:5000')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

/**
 * `true` when the Origin header matches the allow-list. When `requireOrigin`
 * is true and Origin is empty (curl, server-to-server, etc.) returns false
 * — block state-changing methods from non-browser callers.
 */
export const isOriginAllowed = (
  origin: string | undefined,
  requireOrigin: boolean,
): boolean => {
  if (!origin) return !requireOrigin;
  const normalize = (s: string) => s.replace(/\/$/, '').toLowerCase();
  const normalizedOrigin = normalize(origin);
  const allowed = getAllowedOrigins().map(normalize);
  return allowed.includes(normalizedOrigin);
};

export interface ApplyCorsOptions {
  /** HTTP methods this endpoint accepts (Access-Control-Allow-Methods). */
  methods: string;
  /** Require Origin header on POST/PATCH/PUT/DELETE/OPTIONS. Default true. */
  requireOriginOnWrites?: boolean;
}

/**
 * Apply CORS headers AND enforce the allow-list on state-changing methods.
 * Returns:
 *   - `'reject'` — caller must `return res.status(403).end()` immediately.
 *   - `'preflight'` — OPTIONS handled, caller must `return`.
 *   - `'continue'` — proceed with the handler body.
 *
 * Compared to the bare `allowCors` helpers that lived in each visual-led
 * endpoint (which echoed any Origin without checking the allow-list),
 * this one closes the cross-origin write hole.
 */
export const applyCors = (
  req: VercelRequest,
  res: VercelResponse,
  options: ApplyCorsOptions,
): 'reject' | 'preflight' | 'continue' => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const isWrite = req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT' || req.method === 'DELETE' || req.method === 'OPTIONS';
  const requireOrigin = (options.requireOriginOnWrites ?? true) && isWrite;

  if (!isOriginAllowed(origin, requireOrigin)) {
    return 'reject';
  }

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', options.methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return 'preflight';
  }

  return 'continue';
};
