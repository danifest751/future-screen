/**
 * Pure edge-detection / line-snapping helpers used by Assist. Extracted
 * from the legacy visualizer so the React rewrite and any future tests
 * can share the same algorithm. No canvas / DOM dependencies — callers
 * pass in `ImageData`-like buffers and explicit width/height.
 */

import {
  angleDistance,
  clamp,
  getCornersBounds,
  lineFromPoints,
  lineIntersection,
  orderQuadPoints,
  percentile,
} from './geometry';
import type { Point, Quad } from './types';

export interface AssistSample {
  x: number;
  y: number;
  /** Edge orientation in [0, π). */
  angle: number;
  /** Gradient magnitude. */
  mag: number;
}

export interface NormalFormLine {
  nx: number;
  ny: number;
  d: number;
}

/**
 * Luma (ITU-R BT.709) of an RGBA pixel at (x,y). Out-of-range reads
 * return 0 — matches the legacy behaviour.
 */
export function getLumaAt(
  data: Uint8ClampedArray | number[],
  width: number,
  x: number,
  y: number,
): number {
  const i = (y * width + x) * 4;
  const r = data[i] || 0;
  const g = data[i + 1] || 0;
  const b = data[i + 2] || 0;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Centred-difference gradient over the image, emitting only samples
 * with magnitude ≥ 42 (legacy threshold). Step is 2 pixels to keep the
 * sample count manageable on large ROIs.
 */
export function collectAssistSamples(imageData: ImageData): AssistSample[] {
  const samples: AssistSample[] = [];
  const { width, height, data } = imageData;
  const threshold = 42;
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const gx = getLumaAt(data, width, x + 1, y) - getLumaAt(data, width, x - 1, y);
      const gy = getLumaAt(data, width, x, y + 1) - getLumaAt(data, width, x, y - 1);
      const mag = Math.hypot(gx, gy);
      if (mag < threshold) continue;
      // Edge orientation is perpendicular to the gradient.
      const angle = ((Math.atan2(gy, gx) + Math.PI / 2) % Math.PI + Math.PI) % Math.PI;
      samples.push({ x, y, angle, mag });
    }
  }
  return samples;
}

/**
 * Two dominant edge orientations in the sample set, at least 20° apart.
 * Returns null if the image is too flat (< 80 samples above threshold).
 */
export function dominantAssistAngles(samples: AssistSample[]): [number, number] | null {
  if (samples.length < 80) return null;
  const bins = 36;
  const hist = new Array<number>(bins).fill(0);
  for (const sample of samples) {
    const idx = Math.floor((sample.angle / Math.PI) * bins) % bins;
    hist[idx] += sample.mag;
  }

  let first = -1;
  let firstValue = -1;
  for (let i = 0; i < bins; i += 1) {
    if (hist[i] > firstValue) {
      firstValue = hist[i];
      first = i;
    }
  }
  if (first < 0) return null;
  const firstAngle = (first / bins) * Math.PI;

  let second = -1;
  let secondValue = -1;
  for (let i = 0; i < bins; i += 1) {
    const angle = (i / bins) * Math.PI;
    if (angleDistance(angle, firstAngle) < (20 * Math.PI) / 180) continue;
    if (hist[i] > secondValue) {
      second = i;
      secondValue = hist[i];
    }
  }
  if (second < 0 || secondValue <= 0) return null;
  return [firstAngle, (second / bins) * Math.PI];
}

/**
 * For the given orientation, find two parallel lines (min/max projection
 * among the near-aligned samples) — basically the outer edges of an
 * object that has that orientation.
 */
export function linesForAssistAngle(
  samples: AssistSample[],
  angle: number,
): [NormalFormLine, NormalFormLine] | null {
  const tolerance = (12 * Math.PI) / 180;
  const oriented = samples.filter((s) => angleDistance(s.angle, angle) <= tolerance);
  if (oriented.length < 40) return null;
  const nx = -Math.sin(angle);
  const ny = Math.cos(angle);
  const projections = oriented.map((s) => nx * s.x + ny * s.y);
  const dMin = percentile(projections, 0.1);
  const dMax = percentile(projections, 0.9);
  return [
    { nx, ny, d: dMin },
    { nx, ny, d: dMax },
  ];
}

export interface EdgeSnapResult {
  corners: Quad;
  lines: NormalFormLine[];
  avgMove: number;
}

/**
 * Given a rough quad and sample set, look for the best-fitting line for
 * each edge and re-derive the corners from those lines. Returns `null`
 * if any edge lacks support or the refinement didn't move the corners
 * meaningfully (< 0.75px avg).
 */
export function refineCornersByEdgeSnap(
  localCorners: Quad | null,
  samples: AssistSample[],
): EdgeSnapResult | null {
  if (!localCorners || localCorners.length !== 4) return null;
  if (!samples || samples.length < 40) return null;

  const tolerance = (18 * Math.PI) / 180;
  const lines: NormalFormLine[] = [];

  for (let i = 0; i < 4; i += 1) {
    const p1 = localCorners[i];
    const p2 = localCorners[(i + 1) % 4];
    const base = lineFromPoints(p1, p2);
    const oriented = samples.filter((s) => angleDistance(s.angle, base.angle) <= tolerance);
    if (oriented.length < 18) return null;
    const projections = oriented.map((s) => base.nx * s.x + base.ny * s.y);
    const nearest = [...projections]
      .sort((a, b) => Math.abs(a - base.d) - Math.abs(b - base.d))
      .slice(0, Math.min(80, projections.length));
    const snapped = percentile(nearest, 0.5);
    const blended = base.d * 0.35 + snapped * 0.65;
    lines.push({ nx: base.nx, ny: base.ny, d: blended });
  }

  const c0 = lineIntersection(lines[0], lines[1]);
  const c1 = lineIntersection(lines[1], lines[2]);
  const c2 = lineIntersection(lines[2], lines[3]);
  const c3 = lineIntersection(lines[3], lines[0]);
  if (!c0 || !c1 || !c2 || !c3) return null;

  const corners = orderQuadPoints([c0, c1, c2, c3]);
  const avgMove =
    corners.reduce(
      (sum, point, idx) =>
        sum + Math.hypot(point.x - localCorners[idx].x, point.y - localCorners[idx].y),
      0,
    ) / 4;
  if (avgMove < 0.75) return null;
  return { corners, lines, avgMove };
}

/**
 * Sanity check for an assist-produced quad: area must fall between 1%
 * and 90% of the reference area (ROI if given, canvas otherwise) and
 * every corner must lie within ±10% of the bounds.
 */
export function isAssistQuadUsable(
  corners: Point[] | null | undefined,
  bounds: { width: number; height: number },
): boolean {
  if (!corners || corners.length !== 4) return false;
  let area2 = 0;
  for (let i = 0; i < 4; i += 1) {
    const p1 = corners[i];
    const p2 = corners[(i + 1) % 4];
    area2 += p1.x * p2.y - p2.x * p1.y;
  }
  const area = Math.abs(area2) / 2;
  const imageArea = bounds.width * bounds.height;
  if (area < imageArea * 0.01 || area > imageArea * 0.9) return false;
  return corners.every(
    (p) =>
      p.x >= -bounds.width * 0.1 &&
      p.x <= bounds.width * 1.1 &&
      p.y >= -bounds.height * 0.1 &&
      p.y <= bounds.height * 1.1,
  );
}

/**
 * Seed corners for assist when there's nothing to start from — a
 * centred rectangle covering the middle 40% of the canvas. Callers can
 * pass their own `baseCorners` to skip this and snap to those instead.
 */
export function fallbackAssistCorners(
  width: number,
  height: number,
  baseCorners: Quad | null = null,
): Quad {
  if (baseCorners && baseCorners.length === 4) {
    return [
      { x: baseCorners[0].x, y: baseCorners[0].y },
      { x: baseCorners[1].x, y: baseCorners[1].y },
      { x: baseCorners[2].x, y: baseCorners[2].y },
      { x: baseCorners[3].x, y: baseCorners[3].y },
    ];
  }
  return [
    { x: width * 0.32, y: height * 0.33 },
    { x: width * 0.68, y: height * 0.36 },
    { x: width * 0.72, y: height * 0.72 },
    { x: width * 0.28, y: height * 0.7 },
  ];
}

/**
 * Compute the ROI (region-of-interest) rectangle around a target quad
 * for the edge analysis. Falls back to the full canvas when there's no
 * target.
 */
export function getAssistRoi(
  targetCorners: Quad | null | undefined,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number; width: number; height: number } {
  if (!targetCorners || targetCorners.length !== 4) {
    return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
  }
  const bounds = getCornersBounds(targetCorners);
  const padX = Math.max(28, bounds.width * 0.35);
  const padY = Math.max(28, bounds.height * 0.35);
  const x = clamp(Math.floor(bounds.minX - padX), 0, canvasWidth - 1);
  const y = clamp(Math.floor(bounds.minY - padY), 0, canvasHeight - 1);
  const maxW = canvasWidth - x;
  const maxH = canvasHeight - y;
  const width = clamp(Math.ceil(bounds.width + padX * 2), 64, maxW);
  const height = clamp(Math.ceil(bounds.height + padY * 2), 64, maxH);
  return { x, y, width, height };
}
