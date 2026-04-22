/**
 * Operations on screen quads that don't touch the canvas / DOM.
 */

import { distance } from './geometry';
import type { Point, Quad, ScaleCalibration } from './types';
import type { ScreenSizeMeters } from './cabinet';

/**
 * Rescale a quad to match target physical dimensions (width × height in
 * metres) while preserving orientation and centre. The width axis is
 * taken as the midpoint-left → midpoint-right vector of the quad, and
 * the height axis as midpoint-top → midpoint-bottom. Each corner is
 * decomposed into along-width/along-height components, rescaled, and
 * reassembled — any residual (for non-parallelogram quads) is preserved
 * so the overall shape distorts minimally.
 *
 * Caller must supply the current real-world size (use
 * `getElementSizeMeters`) so we can derive sx/sy.
 */
export function scaleQuadToMetric(
  corners: Quad,
  currentSize: ScreenSizeMeters,
  target: ScreenSizeMeters,
): Quad {
  if (currentSize.width <= 0 || currentSize.height <= 0) {
    return corners;
  }
  const sx = target.width / currentSize.width;
  const sy = target.height / currentSize.height;

  const c: Point = {
    x: (corners[0].x + corners[1].x + corners[2].x + corners[3].x) / 4,
    y: (corners[0].y + corners[1].y + corners[2].y + corners[3].y) / 4,
  };

  const mt = { x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2 };
  const mb = { x: (corners[3].x + corners[2].x) / 2, y: (corners[3].y + corners[2].y) / 2 };
  const ml = { x: (corners[0].x + corners[3].x) / 2, y: (corners[0].y + corners[3].y) / 2 };
  const mr = { x: (corners[1].x + corners[2].x) / 2, y: (corners[1].y + corners[2].y) / 2 };

  const wv0 = { x: mr.x - ml.x, y: mr.y - ml.y };
  const hv0 = { x: mb.x - mt.x, y: mb.y - mt.y };
  const wLen = Math.hypot(wv0.x, wv0.y) || 1;
  const hLen = Math.hypot(hv0.x, hv0.y) || 1;
  const wv = { x: wv0.x / wLen, y: wv0.y / wLen };
  const hv = { x: hv0.x / hLen, y: hv0.y / hLen };

  return corners.map((p) => {
    const vx = p.x - c.x;
    const vy = p.y - c.y;
    const a = vx * wv.x + vy * wv.y;
    const b = vx * hv.x + vy * hv.y;
    const rx = vx - a * wv.x - b * hv.x;
    const ry = vy - a * wv.y - b * hv.y;
    return {
      x: c.x + sx * a * wv.x + sy * b * hv.x + rx,
      y: c.y + sx * a * wv.y + sy * b * hv.y + ry,
    };
  }) as Quad;
}

/** Convert a corner quad from pixel space to metric space given a calibration. */
export function quadToMetric(
  corners: Quad,
  scale: ScaleCalibration,
): { widthTop: number; widthBottom: number; heightLeft: number; heightRight: number } {
  const ppm = scale.pxPerMeter;
  return {
    widthTop: distance(corners[0], corners[1]) / ppm,
    widthBottom: distance(corners[3], corners[2]) / ppm,
    heightLeft: distance(corners[0], corners[3]) / ppm,
    heightRight: distance(corners[1], corners[2]) / ppm,
  };
}

/** Translate every corner by (dx,dy). Pure. */
export function translateQuad(corners: Quad, dx: number, dy: number): Quad {
  return corners.map((p) => ({ x: p.x + dx, y: p.y + dy })) as Quad;
}

/**
 * Move a single corner to (x,y), returning a new quad. Used by the drag
 * handler when the user grabs a corner handle.
 */
export function moveCorner(corners: Quad, index: number, target: Point): Quad {
  if (index < 0 || index > 3) return corners;
  const next = [...corners] as Quad;
  next[index] = { x: target.x, y: target.y };
  return next;
}
