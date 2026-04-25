import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { orderQuadPoints } from '../../src/lib/visualLedAssist';
import { applyCors } from '../_lib/cors.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cors = applyCors(req, res, { methods: 'POST, OPTIONS' });
  if (cors === 'reject') return res.status(403).json({ error: 'Forbidden origin' });
  if (cors === 'preflight') return;
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
