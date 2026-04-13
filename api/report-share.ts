import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

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

const bodySchema = z.object({
  html: z.string().min(1).max(MAX_HTML_LENGTH),
  session_key: z.string().min(8).max(120).optional(),
  export_scope: z.enum(['active', 'all']).optional(),
  preview_image: z.string().max(1_500_000).optional(),
  metrics: z
    .object({
      screens_current: z.number().int().min(0).optional(),
      scenes_total: z.number().int().min(0).optional(),
      backgrounds_total: z.number().int().min(0).optional(),
      has_active_background: z.boolean().optional(),
    })
    .optional(),
});

const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true;
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

const sanitizeHtml = (html: string): string => {
  const trimmed = html.trim();
  const lowered = trimmed.toLowerCase();
  if (lowered.includes('<script')) {
    throw new Error('Script tags are not allowed in shared report HTML');
  }
  return trimmed;
};

const randomSlug = (length = 14): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let value = '';
  for (let i = 0; i < length; i += 1) {
    value += chars[Math.floor(Math.random() * chars.length)];
  }
  return value;
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
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.status(200).send(html);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = normalizeOrigin(req.headers.origin);
  const method = req.method || '';

  if (origin && !isOriginAllowed(origin)) {
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

      const html = sanitizeHtml(parsed.data.html);
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
        .select('html')
        .eq('slug', slug)
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
