import { quadPoint } from './geometry';
import type { Point, Quad } from './types';

export interface AffineMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

/**
 * Solve the 6-parameter affine transform that maps source triangle
 * (s0,s1,s2) onto destination triangle (d0,d1,d2). Returns `null` if the
 * source triangle is degenerate. Pure math — no canvas ops here.
 */
export function solveAffineForTriangle(
  s0: Point,
  s1: Point,
  s2: Point,
  d0: Point,
  d1: Point,
  d2: Point,
): AffineMatrix | null {
  const sx0 = s0.x;
  const sy0 = s0.y;
  const sx1 = s1.x;
  const sy1 = s1.y;
  const sx2 = s2.x;
  const sy2 = s2.y;
  const dx0 = d0.x;
  const dy0 = d0.y;
  const dx1 = d1.x;
  const dy1 = d1.y;
  const dx2 = d2.x;
  const dy2 = d2.y;
  const den = sx0 * (sy1 - sy2) + sx1 * (sy2 - sy0) + sx2 * (sy0 - sy1);
  if (Math.abs(den) < 1e-6) return null;

  const a = (dx0 * (sy1 - sy2) + dx1 * (sy2 - sy0) + dx2 * (sy0 - sy1)) / den;
  const b = (dy0 * (sy1 - sy2) + dy1 * (sy2 - sy0) + dy2 * (sy0 - sy1)) / den;
  const c = (dx0 * (sx2 - sx1) + dx1 * (sx0 - sx2) + dx2 * (sx1 - sx0)) / den;
  const d = (dy0 * (sx2 - sx1) + dy1 * (sx0 - sx2) + dy2 * (sx1 - sx0)) / den;
  const e =
    (dx0 * (sx1 * sy2 - sx2 * sy1) +
      dx1 * (sx2 * sy0 - sx0 * sy2) +
      dx2 * (sx0 * sy1 - sx1 * sy0)) /
    den;
  const f =
    (dy0 * (sx1 * sy2 - sx2 * sy1) +
      dy1 * (sx2 * sy0 - sx0 * sy2) +
      dy2 * (sx0 * sy1 - sx1 * sy0)) /
    den;
  return { a, b, c, d, e, f };
}

/**
 * Draw a warped source (image/video/canvas) onto the destination quad by
 * splitting it into a `cols × rows` grid of triangles and applying an
 * affine transform per-triangle. Preserves the legacy behaviour (10×10
 * grid default) — finer grids give smoother perspective at the cost of
 * draw calls.
 */
export function drawWarpedSource(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource & { videoWidth?: number; videoHeight?: number; naturalWidth?: number; naturalHeight?: number; width?: number; height?: number },
  corners: Quad,
  cols = 10,
  rows = 10,
): void {
  const w = source.videoWidth || source.naturalWidth || source.width || 0;
  const h = source.videoHeight || source.naturalHeight || source.height || 0;
  if (!w || !h) return;

  ctx.save();
  clipToQuad(ctx, corners);

  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const u0 = i / cols;
      const u1 = (i + 1) / cols;
      const v0 = j / rows;
      const v1 = (j + 1) / rows;

      const d00 = quadPoint(corners, u0, v0);
      const d10 = quadPoint(corners, u1, v0);
      const d11 = quadPoint(corners, u1, v1);
      const d01 = quadPoint(corners, u0, v1);

      const s00 = { x: u0 * w, y: v0 * h };
      const s10 = { x: u1 * w, y: v0 * h };
      const s11 = { x: u1 * w, y: v1 * h };
      const s01 = { x: u0 * w, y: v1 * h };

      drawSourceTriangle(ctx, source, s00, s10, s11, d00, d10, d11, 0.75);
      drawSourceTriangle(ctx, source, s00, s11, s01, d00, d11, d01, 0.75);
    }
  }

  ctx.restore();
}

function clipToQuad(ctx: CanvasRenderingContext2D, corners: Quad): void {
  const [p0, p1, p2, p3] = corners;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.clip();
}

function expandTriangle(
  p0: Point,
  p1: Point,
  p2: Point,
  amount: number,
): [Point, Point, Point] {
  if (amount <= 0) return [p0, p1, p2];
  const cx = (p0.x + p1.x + p2.x) / 3;
  const cy = (p0.y + p1.y + p2.y) / 3;
  const expand = (p: Point): Point => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) return p;
    const scale = (len + amount) / len;
    return { x: cx + dx * scale, y: cy + dy * scale };
  };
  return [expand(p0), expand(p1), expand(p2)];
}

/**
 * Canvas-facing wrapper — clip to the destination triangle, apply the
 * affine, draw the source image. Used by `drawWarpedSource` as a
 * building block; exposed so the React renderer can call it directly if
 * needed.
 */
export function drawSourceTriangle(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  s0: Point,
  s1: Point,
  s2: Point,
  d0: Point,
  d1: Point,
  d2: Point,
  bleedPx = 0,
): void {
  const matrix = solveAffineForTriangle(s0, s1, s2, d0, d1, d2);
  if (!matrix) return;
  const [c0, c1, c2] = expandTriangle(d0, d1, d2, bleedPx);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(c0.x, c0.y);
  ctx.lineTo(c1.x, c1.y);
  ctx.lineTo(c2.x, c2.y);
  ctx.closePath();
  ctx.clip();
  ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
  ctx.drawImage(source, 0, 0);
  ctx.restore();
}
