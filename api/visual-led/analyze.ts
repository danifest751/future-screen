import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { analyzeAssistFromImageData, buildAssistFromFallback } from '../../src/lib/visualLedAssist';
import { checkRateLimit } from '../_lib/rateLimit.js';
import { applyCors } from '../_lib/cors.js';

const MAX_RGBA_VALUES = 8_388_608; // ~8.4M ints ~= 2M px frame (rgba)

const payloadSchema = z.object({
  width: z.number().int().min(64).max(4096),
  height: z.number().int().min(64).max(4096),
  rgba: z.array(z.number().int().min(0).max(255)).max(MAX_RGBA_VALUES).optional(),
});

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
  const first = raw.split(',')[0]?.trim();
  return first || 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cors = applyCors(req, res, { methods: 'POST, OPTIONS' });
  if (cors === 'reject') return res.status(403).json({ error: 'Forbidden origin' });
  if (cors === 'preflight') return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIp(req);
  const rl = await checkRateLimit('visualLedAnalyze', ip);
  if (!rl.allowed) {
    res.setHeader('Retry-After', Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000)).toString());
    return res.status(429).json({ error: 'Too many analyze requests, try again later' });
  }

  const parsed = payloadSchema.safeParse(toJsonBody(req.body));
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.errors });
  }

  const { width, height, rgba } = parsed.data;
  if (!rgba || rgba.length !== width * height * 4) {
    const fallback = buildAssistFromFallback(width, height);
    return res.status(200).json({ ok: true, result: fallback, mode: 'fallback-no-rgba' });
  }

  const imageData = {
    width,
    height,
    data: Uint8ClampedArray.from(rgba),
  };
  const result = analyzeAssistFromImageData(imageData);
  return res.status(200).json({ ok: true, result, mode: 'analyzed' });
}
