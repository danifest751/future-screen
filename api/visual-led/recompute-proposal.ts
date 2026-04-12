import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { orderQuadPoints } from '../../src/lib/visualLedAssist';

const pointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const payloadSchema = z.object({
  width: z.number().int().min(64).max(4096),
  height: z.number().int().min(64).max(4096),
  corners: z.array(pointSchema).length(4),
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

  const normalizedCorners = parsed.data.corners.map((point) => ({ x: Number(point.x), y: Number(point.y) }));
  const ordered = orderQuadPoints(normalizedCorners);
  return res.status(200).json({
    ok: true,
    result: {
      source: 'auto',
      confidence: 'medium',
      score: 0.62,
      confidenceReason: 'Контур пересчитан по пользовательским точкам',
      dominantAnglesDeg: null,
      guides: [],
      corners: ordered,
    },
  });
}
