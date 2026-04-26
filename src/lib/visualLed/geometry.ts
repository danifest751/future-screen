import type { Point, Quad } from './types';

/** Euclidean distance between two points. */
export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Clamp a value into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Point-in-triangle via sign-of-cross test. Matches the legacy visualizer
 * implementation — preserved so assist output stays identical.
 */
export function pointInTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
  const sign = (p1: Point, p2: Point, p3: Point) =>
    (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  const d1 = sign(p, a, b);
  const d2 = sign(p, b, c);
  const d3 = sign(p, c, a);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

/** Point-in-quadrilateral — splits the quad into two triangles. */
export function pointInQuad(p: Point, corners: Quad): boolean {
  return (
    pointInTriangle(p, corners[0], corners[1], corners[2]) ||
    pointInTriangle(p, corners[0], corners[2], corners[3])
  );
}

/**
 * Order four arbitrary points into a consistent TL/TR/BR/BL polygon.
 * 1) Sort by polar angle around centroid.
 * 2) Pick the minimum-(x+y) point as the TL anchor.
 * 3) Reverse if the resulting winding is clockwise so the polygon is CCW.
 */
export function orderQuadPoints(points: Point[]): Quad {
  if (points.length !== 4) {
    throw new Error(`orderQuadPoints expects 4 points, got ${points.length}`);
  }
  const center = points.reduce(
    (acc, p) => ({ x: acc.x + p.x / 4, y: acc.y + p.y / 4 }),
    { x: 0, y: 0 },
  );
  const sorted = [...points].sort(
    (p1, p2) =>
      Math.atan2(p1.y - center.y, p1.x - center.x) -
      Math.atan2(p2.y - center.y, p2.x - center.x),
  );
  let anchorIdx = 0;
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < 4; i += 1) {
    const score = sorted[i].x + sorted[i].y;
    if (score < best) {
      best = score;
      anchorIdx = i;
    }
  }
  const r: Quad = [
    sorted[anchorIdx],
    sorted[(anchorIdx + 1) % 4],
    sorted[(anchorIdx + 2) % 4],
    sorted[(anchorIdx + 3) % 4],
  ];
  // Reverse if clockwise.
  const cross =
    (r[1].x - r[0].x) * (r[2].y - r[1].y) - (r[1].y - r[0].y) * (r[2].x - r[1].x);
  return cross < 0 ? [r[0], r[3], r[2], r[1]] : r;
}

/** Axis-aligned bounding box of a polygon's vertices. */
export function getCornersBounds(corners: Point[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  const xs = corners.map((point) => point.x);
  const ys = corners.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

/** Corner index under the cursor, or -1. `viewScale` compensates for the canvas zoom. */
export function findCornerHit(
  corners: Quad,
  p: Point,
  viewScale = 1,
  radius = 10,
): number {
  const r = radius / viewScale;
  for (let i = 0; i < 4; i += 1) {
    if (distance(corners[i], p) <= r) {
      return i;
    }
  }
  return -1;
}

/**
 * Edge order for an `orderQuadPoints`-ordered quad (TL, TR, BR, BL):
 *   0 — top    (corners 0–1)
 *   1 — right  (corners 1–2)
 *   2 — bottom (corners 3–2)
 *   3 — left   (corners 0–3)
 */
const QUAD_EDGE_PAIRS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [3, 2],
  [0, 3],
];

/**
 * Edge index under the cursor, or -1. Tests proximity to each edge
 * segment, skipping the 10% closest to either endpoint so corner hits
 * aren't shadowed by edge hits. `viewScale` compensates for canvas zoom.
 */
export function findEdgeHit(
  corners: Quad,
  p: Point,
  viewScale = 1,
  radius = 8,
): number {
  const r = radius / viewScale;
  let best = -1;
  let bestDist = r;
  for (let i = 0; i < QUAD_EDGE_PAIRS.length; i += 1) {
    const [iA, iB] = QUAD_EDGE_PAIRS[i];
    const a = corners[iA];
    const b = corners[iB];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-6) continue;
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
    if (t < 0.1 || t > 0.9) continue;
    const fx = a.x + t * dx;
    const fy = a.y + t * dy;
    const d = Math.hypot(p.x - fx, p.y - fy);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/**
 * Window-style resize: drag edge `edgeIdx` by pointer delta (dx, dy);
 * the two corners on that edge slide along the edge's perpendicular by
 * the projected component, while the opposite edge's corners stay put.
 * Works for any quad orientation — for a true rectangle the result is
 * a rectangle with a different size; for a perspective-distorted quad
 * it preserves the slant.
 */
export function resizeQuadEdge(
  corners: Quad,
  edgeIdx: number,
  dx: number,
  dy: number,
): Quad {
  const pair = QUAD_EDGE_PAIRS[edgeIdx];
  if (!pair) return corners;
  const [iA, iB] = pair;
  const ex = corners[iB].x - corners[iA].x;
  const ey = corners[iB].y - corners[iA].y;
  const len = Math.hypot(ex, ey);
  if (len < 1e-6) return corners;
  // Perpendicular to the edge (sign chosen consistently). Pointer
  // delta projected onto this gives the resize amount; both corners
  // on the edge translate by `proj * perp`.
  const px = ey / len;
  const py = -ex / len;
  const proj = dx * px + dy * py;
  const dxA = px * proj;
  const dyA = py * proj;
  return corners.map((p, i) => {
    if (i === iA || i === iB) {
      return { x: p.x + dxA, y: p.y + dyA };
    }
    return p;
  }) as Quad;
}

/**
 * Midpoint of edge `edgeIdx`. Used by the renderer to draw the edge
 * resize handles between corners.
 */
export function getEdgeMidpoint(corners: Quad, edgeIdx: number): Point | null {
  const pair = QUAD_EDGE_PAIRS[edgeIdx];
  if (!pair) return null;
  const [iA, iB] = pair;
  return {
    x: (corners[iA].x + corners[iB].x) / 2,
    y: (corners[iA].y + corners[iB].y) / 2,
  };
}

/** Line represented in normal form: nx*x + ny*y = d; angle in [0, π). */
export interface Line {
  nx: number;
  ny: number;
  d: number;
  angle: number;
}

export function lineFromPoints(pointA: Point, pointB: Point): Line {
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const angle = ((Math.atan2(dy, dx) % Math.PI) + Math.PI) % Math.PI;
  return { nx, ny, d: nx * pointA.x + ny * pointA.y, angle };
}

// Note: lineIntersection only needs the normal + offset — `angle` is
// used elsewhere but not here, so we widen the parameter type so assist
// (which stores lines without an angle) can still call it directly.
export function lineIntersection(
  lineA: Pick<Line, 'nx' | 'ny' | 'd'>,
  lineB: Pick<Line, 'nx' | 'ny' | 'd'>,
): Point | null {
  const det = lineA.nx * lineB.ny - lineB.nx * lineA.ny;
  if (Math.abs(det) < 1e-6) return null;
  return {
    x: (lineA.d * lineB.ny - lineB.d * lineA.ny) / det,
    y: (lineA.nx * lineB.d - lineB.nx * lineA.d) / det,
  };
}

/**
 * Clip an infinite line against a canvas rectangle [0..width, 0..height]
 * and return the two boundary intersections, or null if it doesn't cross.
 */
export function lineClipToCanvas(
  line: Pick<Line, 'nx' | 'ny' | 'd'>,
  canvasWidth: number,
  canvasHeight: number,
): [Point, Point] | null {
  const points: Point[] = [];
  const eps = 1e-6;
  if (Math.abs(line.ny) > eps) {
    const yLeft = (line.d - line.nx * 0) / line.ny;
    const yRight = (line.d - line.nx * canvasWidth) / line.ny;
    if (yLeft >= 0 && yLeft <= canvasHeight) points.push({ x: 0, y: yLeft });
    if (yRight >= 0 && yRight <= canvasHeight) points.push({ x: canvasWidth, y: yRight });
  }
  if (Math.abs(line.nx) > eps) {
    const xTop = (line.d - line.ny * 0) / line.nx;
    const xBottom = (line.d - line.ny * canvasHeight) / line.nx;
    if (xTop >= 0 && xTop <= canvasWidth) points.push({ x: xTop, y: 0 });
    if (xBottom >= 0 && xBottom <= canvasWidth) points.push({ x: xBottom, y: canvasHeight });
  }
  const unique: Point[] = [];
  for (const point of points) {
    if (!unique.some((u) => Math.hypot(u.x - point.x, u.y - point.y) < 0.5)) {
      unique.push(point);
    }
  }
  return unique.length >= 2 ? [unique[0], unique[1]] : null;
}

/** Angular distance in [0, π/2] between two angles (mod π). */
export function angleDistance(a: number, b: number): number {
  const normalize = (value: number) => {
    let result = value % Math.PI;
    if (result < 0) result += Math.PI;
    return result;
  };
  const delta = Math.abs(normalize(a) - normalize(b));
  return Math.min(delta, Math.PI - delta);
}

/** Simple linear-interpolation percentile of a numeric array. */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = clamp(Math.floor(sorted.length * p), 0, sorted.length - 1);
  return sorted[idx];
}

/**
 * Bilinear sample of a unit-square uv onto a quad.
 * Corners ordered TL, TR, BR, BL; (u=0,v=0) = TL, (u=1,v=1) = BR.
 */
export function quadPoint(corners: Quad, u: number, v: number): Point {
  const [tl, tr, br, bl] = corners;
  return {
    x:
      (1 - u) * (1 - v) * tl.x +
      u * (1 - v) * tr.x +
      u * v * br.x +
      (1 - u) * v * bl.x,
    y:
      (1 - u) * (1 - v) * tl.y +
      u * (1 - v) * tr.y +
      u * v * br.y +
      (1 - u) * v * bl.y,
  };
}
