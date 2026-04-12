import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { applyCors, getSupabaseAdmin, handleOptions, sanitizeStorageName, toJsonBody } from './_shared';

const bucket = 'visual-led-backgrounds';

const schema = z.object({
  session_key: z.string().min(8).max(120),
  file_name: z.string().min(1).max(220),
  mime_type: z.string().min(3).max(120).optional(),
  data_url: z.string().min(64),
  size_bytes: z.number().int().positive().optional(),
  meta: z.record(z.any()).optional(),
});

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid data URL');
  const mime = match[1];
  const base64 = match[2];
  return { mime, buffer: Buffer.from(base64, 'base64') };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return;
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const parsed = schema.safeParse(toJsonBody(req.body));
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.errors });
    }
    const payload = parsed.data;
    const supabase = getSupabaseAdmin();
    const parsedUrl = parseDataUrl(payload.data_url);
    const mimeType = payload.mime_type || parsedUrl.mime || 'image/jpeg';
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const safeName = sanitizeStorageName(payload.file_name.replace(/\.[^.]+$/, ''));
    const storagePath = `${payload.session_key}/${Date.now()}-${safeName}.${ext}`;

    const { data: uploaded, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, parsedUrl.buffer, {
        contentType: mimeType,
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data: session, error: sessionError } = await supabase
      .from('visual_led_sessions')
      .select('id')
      .eq('session_key', payload.session_key)
      .maybeSingle();
    if (sessionError) throw sessionError;
    const sessionId = session?.id || null;

    if (sessionId) {
      const { error: insertError } = await supabase.from('visual_led_assets').insert({
        session_id: sessionId,
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
      session_linked: Boolean(sessionId),
    });
  } catch (error) {
    console.error('[visual-led-logs/background-upload] error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
