import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { analyzeAssistFromImageData, buildAssistFromFallback } from '../../src/lib/visualLedAssist';

const payloadSchema = z.object({
  width: z.number().int().min(64).max(4096),
  height: z.number().int().min(64).max(4096),
  rgba: z.array(z.number().int().min(0).max(255)).optional(),
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

function allowCors(req: VercelRequest, res: VercelResponse): void {
  const origin = String(req.headers.origin || '');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  allowCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
