import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';

// preview_image lands in admin's <img src=...> later, so anything other
// than a real image data-URL would be smuggled HTML/JS. We accept only
// the four browser-supported raster formats; everything else is rejected.
const PREVIEW_IMAGE_RE = /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'https://future-screen.ru,https://future-screen.vercel.app,http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const SHARE_TABLE = 'shared_reports';
const MAX_HTML_LENGTH = 4_000_000;

let supabaseAdmin: SupabaseClient | null = null;
let domPurifyInstance:
  | { sanitize: (value: string, config?: Record<string, unknown>) => string }
  | null
  | undefined;

const bodySchema = z.object({
  html: z.string().min(1).max(MAX_HTML_LENGTH),
  session_key: z.string().min(8).max(120).optional(),
  export_scope: z.enum(['active', 'all']).optional(),
  preview_image: z
    .string()
    .max(1_500_000)
    .regex(PREVIEW_IMAGE_RE, 'preview_image must be a data:image/{png,jpeg,webp};base64 URL')
    .optional(),
  metrics: z
    .object({
      screens_current: z.number().int().min(0).optional(),
      scenes_total: z.number().int().min(0).optional(),
      backgrounds_total: z.number().int().min(0).optional(),
      has_active_background: z.boolean().optional(),
    })
    .optional(),
});

const isOriginAllowed = (origin: string | undefined, requireOrigin: boolean): boolean => {
  if (!origin) return !requireOrigin; // POST требует Origin; GET (публичный просмотр) — нет.
  const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
  const normalizedAllowed = allowedOrigins.map((item) => item.replace(/\/$/, '').toLowerCase());
  return normalizedAllowed.includes(normalizedOrigin);
};

const normalizeOrigin = (origin?: string): string => origin?.replace(/\/$/, '') || '';

const getSupabaseAdmin = (): SupabaseClient => {
  if (supabaseAdmin) return supabaseAdmin;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase env vars are not configured for report share API');
  }
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } });
  return supabaseAdmin;
};

async function getDomPurify() {
  if (domPurifyInstance !== undefined) return domPurifyInstance;
  try {
    const mod = await import('isomorphic-dompurify');
    const candidate = ((mod as { default?: unknown }).default ?? mod) as {
      sanitize?: (value: string, config?: Record<string, unknown>) => string;
    };
    if (typeof candidate?.sanitize === 'function') {
      domPurifyInstance = { sanitize: candidate.sanitize.bind(candidate) };
    } else {
      domPurifyInstance = null;
    }
  } catch (error) {
    // Do not fail function bootstrap if DOMPurify import breaks in a given runtime.
    console.warn('[report-share] DOMPurify import failed, using regex fallback sanitizer', error);
    domPurifyInstance = null;
  }
  return domPurifyInstance;
}

function fallbackSanitizeHtml(html: string): string {
  // Defence-in-depth fallback if DOMPurify is unavailable at runtime.
  // Main protection still comes from strict sandbox CSP on /reports/*.
  let safe = html.trim();
  safe = safe.replace(
    /<\s*(script|iframe|object|embed|base|meta|link|form)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    '',
  );
  safe = safe.replace(/<\s*(script|iframe|object|embed|base|meta|link|form)\b[^>]*\/?\s*>/gi, '');
  safe = safe.replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '');
  safe = safe.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '');
  safe = safe.replace(/\ssrcdoc\s*=\s*(['"]).*?\1/gi, '');
  safe = safe.replace(/javascript:/gi, '');
  return safe;
}

// Server-side DOMPurify (primary path). The previous check
// `html.toLowerCase().includes('<script')` was bypassable.
// We keep a resilient fallback so the endpoint doesn't crash if a runtime
// cannot initialize DOMPurify.
const sanitizeHtml = async (html: string): Promise<string> => {
  const purifier = await getDomPurify();
  if (!purifier) return fallbackSanitizeHtml(html);
  return purifier.sanitize(html.trim(), {
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'meta', 'link', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'srcdoc'],
    ALLOW_DATA_ATTR: false,
    WHOLE_DOCUMENT: true,
    RETURN_TRUSTED_TYPE: false,
  });
};

const randomSlug = (length = 14): string => {
  // crypto.randomBytes vs Math.random: ~80 bits of entropy, no
  // predictability — anyone who scrapes a few share URLs can't enumerate
  // the rest. We base64url-encode then strip non-alphanum so the slug
  // stays URL-safe and lowercase-friendly in /reports/<slug>.
  return randomBytes(Math.ceil(length))
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .slice(0, length);
};

const createUniqueSlug = async (supabase: SupabaseClient): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = randomSlug(14);
    const { data, error } = await supabase
      .from(SHARE_TABLE)
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return slug;
  }
  throw new Error('Failed to generate unique slug');
};

const sendHtmlResponse = (res: VercelResponse, html: string): VercelResponse => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  // Defence-in-depth: even if something slips past DOMPurify, the browser
  // runs the page sandboxed — no script execution, no top-level navigation,
  // no cookies or storage access. `allow-same-origin` keeps images from
  // our own Supabase storage visible; that's the most permissive bit set.
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'none'",
      "script-src 'none'",
      "style-src 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data: https:",
      "base-uri 'none'",
      "form-action 'none'",
      "sandbox allow-same-origin",
    ].join('; '),
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  return res.status(200).send(html);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = normalizeOrigin(req.headers.origin);
  const method = req.method || '';
  const requireOrigin = method === 'POST' || method === 'OPTIONS';

  if (!isOriginAllowed(origin || undefined, requireOrigin)) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabase = getSupabaseAdmin();

    if (method === 'POST') {
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.errors });
      }

      const html = await sanitizeHtml(parsed.data.html);
      const slug = await createUniqueSlug(supabase);

      const { error } = await supabase.from(SHARE_TABLE).insert({
        slug,
        html,
      });
      if (error) throw error;

      const host = normalizeOrigin(process.env.PUBLIC_SITE_URL) || origin || 'https://future-screen.vercel.app';
      const url = `${host}/reports/${slug}`;

      const sessionKey = parsed.data.session_key?.trim();
      const exportScope = parsed.data.export_scope || null;
      const metrics = parsed.data.metrics || null;
      const previewImage = parsed.data.preview_image || null;
      if (sessionKey) {
        try {
          const { data: sessionData, error: sessionError } = await supabase
            .from('visual_led_sessions')
            .select('id, summary')
            .eq('session_key', sessionKey)
            .maybeSingle();
          if (sessionError) {
            throw sessionError;
          }

          let ensuredSession = sessionData;
          if (!ensuredSession?.id) {
            const { data: insertedSession, error: insertSessionError } = await supabase
              .from('visual_led_sessions')
              .insert({
                session_key: sessionKey,
                started_at: new Date().toISOString(),
                page_url: `${host}/visual-led`,
                summary: {
                  source: 'report-share-fallback-session',
                },
              })
              .select('id, summary')
              .single();
            if (insertSessionError) throw insertSessionError;
            ensuredSession = insertedSession;
          }

          if (ensuredSession?.id) {
            await supabase.from('visual_led_events').insert({
              session_id: ensuredSession.id,
              ts: new Date().toISOString(),
              event_type: 'report_shared',
              scene_id: null,
              screen_id: null,
              payload: {
                status: 'success',
                url,
                export_scope: exportScope,
                preview_image: previewImage,
                metrics,
                source: 'api-report-share',
              },
            });

            const prevSummary = (ensuredSession.summary && typeof ensuredSession.summary === 'object')
              ? (ensuredSession.summary as Record<string, unknown>)
              : {};
            const nextSummary: Record<string, unknown> = {
              ...prevSummary,
              report_url: url,
              report_export_scope: exportScope,
            };
            const prevHistory = Array.isArray(prevSummary.report_history)
              ? (prevSummary.report_history as unknown[])
              : [];
            const newHistoryEntry = {
              at: new Date().toISOString(),
              url,
              scope: exportScope,
              preview_image: previewImage,
              metrics,
            };
            nextSummary.report_history = [...prevHistory, newHistoryEntry].slice(-20);
            if (metrics) {
              if (typeof metrics.screens_current === 'number') nextSummary.screens = metrics.screens_current;
              if (typeof metrics.scenes_total === 'number') nextSummary.scenes = metrics.scenes_total;
              if (typeof metrics.backgrounds_total === 'number') nextSummary.backgrounds = metrics.backgrounds_total;
              if (typeof metrics.has_active_background === 'boolean') {
                nextSummary.has_active_background = metrics.has_active_background;
              }
            }

            await supabase
              .from('visual_led_sessions')
              .update({ summary: nextSummary })
              .eq('id', ensuredSession.id);
          }
        } catch (logError) {
          console.warn('[report-share] failed to write visual_led_events.report_shared', logError);
        }
      }

      return res.status(201).json({ ok: true, slug, url });
    }

    if (method === 'GET') {
      const slug = String(req.query.slug || '').trim().toLowerCase();
      if (!slug || !/^[a-z0-9]{8,32}$/.test(slug)) {
        return res.status(400).send('Invalid report slug');
      }

      const { data, error } = await supabase
        .from(SHARE_TABLE)
        .select('html, expires_at')
        .eq('slug', slug)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      if (error) throw error;
      if (!data?.html) {
        return res.status(404).send('Report not found');
      }

      return sendHtmlResponse(res, data.html);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[report-share] error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
