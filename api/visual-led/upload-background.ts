// POST /api/visual-led/upload-background
// Загружает фон проекта в Supabase Storage и возвращает
// { storage_path, storage_bucket }. Анонимно, rate-limit per IP.
//
// Сохранение проекта (/api/visual-led/save) потом использует этот
// storagePath вместо data URL — так payload проекта укладывается в
// 512 KB cap.
//
// Bucket приватный — клиент получает signed URL через /api/visual-led/load
// при восстановлении проекта.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '../_lib/rateLimit.js';

const BUCKET = 'visual-led-backgrounds';
const MAX_DATA_URL_BYTES = 10 * 1024 * 1024; // ~10MB raw data URL

const payloadSchema = z.object({
  file_name: z.string().min(1).max(220),
  mime_type: z.string().min(3).max(120).optional(),
  data_url: z.string().min(64),
});

let supabaseAdmin: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabaseAdmin) return supabaseAdmin;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing for upload-background');
  supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
  return supabaseAdmin;
}

function allowCors(req: VercelRequest, res: VercelResponse): void {
  const origin = String(req.headers.origin || '');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
  return raw.split(',')[0]?.trim() || 'unknown';
}

function sanitizeStorageName(fileName: string): string {
  return (
    fileName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120) || 'background'
  );
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid data URL');
  return { mime: match[1], buffer: Buffer.from(match[2], 'base64') };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  allowCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIp(req);
  // Reuse the save rate limit bucket — background uploads are tightly
  // coupled to save flows.
  const rl = await checkRateLimit('visualLedSave', ip);
  if (!rl.allowed) {
    res.setHeader('Retry-After', Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000)).toString());
    return res.status(429).json({ error: 'Too many uploads, try again later' });
  }

  const parsed = payloadSchema.safeParse(toJsonBody(req.body));
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.errors });
  }
  const payload = parsed.data;

  if (payload.data_url.length > MAX_DATA_URL_BYTES) {
    return res.status(413).json({
      error: 'Image too large',
      maxBytes: MAX_DATA_URL_BYTES,
      receivedBytes: payload.data_url.length,
    });
  }

  let parsedDataUrl: { mime: string; buffer: Buffer };
  try {
    parsedDataUrl = parseDataUrl(payload.data_url);
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid data URL' });
  }

  const mimeType = payload.mime_type || parsedDataUrl.mime || 'image/jpeg';
  const ext = mimeType.includes('png')
    ? 'png'
    : mimeType.includes('webp')
      ? 'webp'
      : 'jpg';
  const safeName = sanitizeStorageName(payload.file_name.replace(/\.[^.]+$/, ''));
  const storagePath = `projects/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}.${ext}`;

  try {
    const supabase = getSupabase();
    const { data: uploaded, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, parsedDataUrl.buffer, {
        contentType: mimeType,
        upsert: false,
      });
    if (uploadError) throw uploadError;

    return res.status(200).json({
      ok: true,
      storage_bucket: BUCKET,
      storage_path: uploaded.path,
      size_bytes: parsedDataUrl.buffer.length,
    });
  } catch (err) {
    console.error('[visual-led/upload-background] error', err);
    return res.status(500).json({ error: 'Failed to upload background' });
  }
}
