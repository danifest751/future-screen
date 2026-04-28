import type { Point, Quad, ScreenPlacement, Wall, Partition } from './types';

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Get the four corners of a screen rectangle on the floor plan
 * given its placement, width and depth.
 */
export function getScreenRectOnPlan(
  placement: ScreenPlacement,
  widthM: number,
  depthM: number,
): Quad {
  const cos = Math.cos(degToRad(placement.rotation));
  const sin = Math.sin(degToRad(placement.rotation));
  const hw = widthM / 2;
  const hd = depthM / 2;
  const local = [
    { x: -hw, y: -hd },
    { x: hw, y: -hd },
    { x: hw, y: hd },
    { x: -hw, y: hd },
  ];
  return local.map((p) => ({
    x: placement.x + (p.x * cos - p.y * sin),
    y: placement.y + (p.x * sin + p.y * cos),
  })) as Quad;
}

/** Distance between two points. */
export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Dot product of two vectors. */
export function dot(ax: number, ay: number, bx: number, by: number): number {
  return ax * bx + ay * by;
}

/**
 * Minimum distance between two line segments.
 * Returns 0 if they intersect.
 */
export function segmentDistance(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point,
): number {
  // Check for intersection
  if (segmentsIntersect(a1, a2, b1, b2)) return 0;

  // Minimum of distances from each endpoint to the other segment
  const candidates = [
    pointToSegmentDistance(a1, b1, b2),
    pointToSegmentDistance(a2, b1, b2),
    pointToSegmentDistance(b1, a1, a2),
    pointToSegmentDistance(b2, a1, a2),
  ];
  return Math.min(...candidates);
}

/** Distance from point p to segment ab. */
export function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  if (len2 < 1e-12) return dist(p, a);
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  return dist(p, { x: a.x + t * abx, y: a.y + t * aby });
}

/** Check if two segments intersect (excluding endpoints). */
function segmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const d1 = direction(b1, b2, a1);
  const d2 = direction(b1, b2, a2);
  const d3 = direction(a1, a2, b1);
  const d4 = direction(a1, a2, b2);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  return false;
}

function direction(a: Point, b: Point, c: Point): number {
  return (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y);
}

/**
 * Check if the back edge of a screen is at least `minDistance` meters
 * away from all walls and partitions.
 * Returns the minimum distance found (can be < minDistance).
 */
export function checkBackWallDistance(
  placement: ScreenPlacement,
  widthM: number,
  depthM: number,
  walls: Wall[],
  partitions: Partition[],
  minDistance: number,
): { valid: boolean; minDist: number; violatingWallId?: string } {
  const quad = getScreenRectOnPlan(placement, widthM, depthM);
  // Back edge: the two corners with maximum Y in screen-local space.
  // In our coordinate system, +Y is "down" (screen faces "up" / -Y at rotation=0).
  // Actually, let's compute which edge is the back based on rotation.
  // Front edge is the one facing the rotation direction (screen faces away from rotation angle).
  // Wait, let's simplify: at rotation=0, the screen faces "up" (-Y direction).
  // Front edge is the top edge (TL-TR), back edge is bottom edge (BL-BR).
  const backEdge = [quad[3], quad[2]] as [Point, Point];

  let globalMin = Infinity;
  let violatingId: string | undefined;

  for (const wall of walls) {
    const d = segmentDistance(
      backEdge[0],
      backEdge[1],
      { x: wall.x1, y: wall.y1 },
      { x: wall.x2, y: wall.y2 },
    );
    if (d < globalMin) {
      globalMin = d;
      if (d < minDistance) violatingId = wall.id;
    }
  }

  for (const part of partitions) {
    const d = segmentDistance(
      backEdge[0],
      backEdge[1],
      { x: part.x1, y: part.y1 },
      { x: part.x2, y: part.y2 },
    );
    if (d < globalMin) {
      globalMin = d;
      if (d < minDistance) violatingId = part.id;
    }
  }

  return { valid: globalMin >= minDistance, minDist: globalMin, violatingWallId: violatingId };
}

/** Get physical width and depth of a screen element for floor plan. */
export function getScreenPhysicalSize(el: {
  cabinetPlan: { cols: number; rows: number; cabinetSide: number } | null;
}): { width: number; depth: number } | null {
  if (el.cabinetPlan) {
    return {
      width: el.cabinetPlan.cols * el.cabinetPlan.cabinetSide,
      depth: el.cabinetPlan.rows * el.cabinetPlan.cabinetSide,
    };
  }
  return null;
}

/** Get screen assembly depth based on mount type. */
export function getScreenAssemblyDepth(mountType: 'suspended' | 'floor'): number {
  return mountType === 'floor' ? 0.6 : 0.1;
}

/** Project a point onto a line segment, returning the closest point and distance along the segment. */
export function projectPointToSegment(
  p: Point,
  a: Point,
  b: Point,
): { point: Point; t: number; distance: number } {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  if (len2 < 1e-12) {
    return { point: a, t: 0, distance: dist(p, a) };
  }
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  const point = { x: a.x + t * abx, y: a.y + t * aby };
  return { point, t, distance: dist(p, point) };
}
