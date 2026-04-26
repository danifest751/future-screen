import { describe, it, expect } from 'vitest';
import {
  distance,
  clamp,
  pointInTriangle,
  pointInQuad,
  orderQuadPoints,
  getCornersBounds,
  findCornerHit,
  findEdgeHit,
  resizeQuadEdge,
  getEdgeMidpoint,
  lineFromPoints,
  lineIntersection,
  lineClipToCanvas,
  angleDistance,
  percentile,
  quadPoint,
} from './geometry';
import type { Point, Quad } from './types';

describe('geometry basics', () => {
  it('distance is Euclidean', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(distance({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
  });

  it('clamp bounds a value to [min,max]', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('angleDistance returns the minimal mod-π delta', () => {
    expect(angleDistance(0, Math.PI)).toBeCloseTo(0); // mod π they coincide
    expect(angleDistance(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    expect(angleDistance(0, Math.PI / 4)).toBeCloseTo(Math.PI / 4);
  });

  it('percentile handles empty + mid', () => {
    expect(percentile([], 0.5)).toBe(0);
    expect(percentile([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(percentile([1, 2, 3, 4, 5], 0)).toBe(1);
  });
});

describe('point-in tests', () => {
  const a: Point = { x: 0, y: 0 };
  const b: Point = { x: 10, y: 0 };
  const c: Point = { x: 10, y: 10 };
  const d: Point = { x: 0, y: 10 };
  const quad: Quad = [a, b, c, d];

  it('pointInTriangle catches interior and misses exterior', () => {
    expect(pointInTriangle({ x: 3, y: 1 }, a, b, c)).toBe(true);
    expect(pointInTriangle({ x: -1, y: -1 }, a, b, c)).toBe(false);
  });

  it('pointInQuad covers both triangles', () => {
    expect(pointInQuad({ x: 5, y: 5 }, quad)).toBe(true);
    expect(pointInQuad({ x: 1, y: 8 }, quad)).toBe(true);
    expect(pointInQuad({ x: -1, y: 5 }, quad)).toBe(false);
  });

  it('getCornersBounds returns the AABB', () => {
    const { minX, maxX, minY, maxY, width, height } = getCornersBounds(quad);
    expect(minX).toBe(0);
    expect(maxX).toBe(10);
    expect(minY).toBe(0);
    expect(maxY).toBe(10);
    expect(width).toBe(10);
    expect(height).toBe(10);
  });

  it('findCornerHit finds corner within radius and compensates for view scale', () => {
    expect(findCornerHit(quad, { x: 0.5, y: 0.5 }, 1, 10)).toBe(0);
    // Centre of an entirely-outside radius — 50px from every corner.
    expect(findCornerHit(quad, { x: 50, y: 50 }, 1, 10)).toBe(-1);
    // At 10x zoom the hit radius shrinks to 1px, so a small offset misses.
    expect(findCornerHit(quad, { x: 5, y: 5 }, 10, 10)).toBe(-1);
    // Exact corner always hits regardless of scale.
    expect(findCornerHit(quad, { x: 0, y: 0 }, 10, 10)).toBe(0);
  });
});

describe('orderQuadPoints', () => {
  it('orders rotated/shuffled points into TL/TR/BR/BL CCW', () => {
    const shuffled: Point[] = [
      { x: 10, y: 10 },
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 10, y: 0 },
    ];
    const ordered = orderQuadPoints(shuffled);
    expect(ordered[0]).toEqual({ x: 0, y: 0 });
    expect(ordered[1]).toEqual({ x: 10, y: 0 });
    expect(ordered[2]).toEqual({ x: 10, y: 10 });
    expect(ordered[3]).toEqual({ x: 0, y: 10 });
  });

  it('preserves a convex polygon without mangling', () => {
    const input: Point[] = [
      { x: 1, y: 1 },
      { x: 9, y: 2 },
      { x: 11, y: 9 },
      { x: 0, y: 10 },
    ];
    const ordered = orderQuadPoints(input);
    // TL must be the lowest x+y
    expect(ordered[0].x + ordered[0].y).toBe(Math.min(...input.map((p) => p.x + p.y)));
  });

  it('throws on wrong number of points', () => {
    expect(() => orderQuadPoints([{ x: 0, y: 0 }])).toThrow();
  });
});

describe('lines', () => {
  it('lineFromPoints returns a normalized line with angle in [0,π)', () => {
    const line = lineFromPoints({ x: 0, y: 0 }, { x: 1, y: 0 });
    expect(line.angle).toBeCloseTo(0);
    expect(Math.hypot(line.nx, line.ny)).toBeCloseTo(1);
  });

  it('lineIntersection returns the crossing point', () => {
    const h = lineFromPoints({ x: 0, y: 5 }, { x: 10, y: 5 });
    const v = lineFromPoints({ x: 5, y: 0 }, { x: 5, y: 10 });
    const p = lineIntersection(h, v);
    expect(p).not.toBeNull();
    expect(p!.x).toBeCloseTo(5);
    expect(p!.y).toBeCloseTo(5);
  });

  it('lineIntersection returns null for parallel lines', () => {
    const a = lineFromPoints({ x: 0, y: 0 }, { x: 10, y: 0 });
    const b = lineFromPoints({ x: 0, y: 5 }, { x: 10, y: 5 });
    expect(lineIntersection(a, b)).toBeNull();
  });

  it('lineClipToCanvas clips a horizontal line across the full width', () => {
    const line = lineFromPoints({ x: 0, y: 50 }, { x: 100, y: 50 });
    const clipped = lineClipToCanvas(line, 200, 100);
    expect(clipped).not.toBeNull();
    const [p1, p2] = clipped!;
    expect(p1.y).toBeCloseTo(50);
    expect(p2.y).toBeCloseTo(50);
  });
});

describe('quadPoint', () => {
  const quad: Quad = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];
  it('maps corners 1:1', () => {
    expect(quadPoint(quad, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(quadPoint(quad, 1, 0)).toEqual({ x: 10, y: 0 });
    expect(quadPoint(quad, 1, 1)).toEqual({ x: 10, y: 10 });
    expect(quadPoint(quad, 0, 1)).toEqual({ x: 0, y: 10 });
  });

  it('interpolates bilinearly at the centre', () => {
    const p = quadPoint(quad, 0.5, 0.5);
    expect(p.x).toBeCloseTo(5);
    expect(p.y).toBeCloseTo(5);
  });

  it('matches the legacy bilinear formula on a non-axis-aligned quad', () => {
    const skew: Quad = [
      { x: 0, y: 0 },
      { x: 10, y: 2 },
      { x: 12, y: 10 },
      { x: 1, y: 9 },
    ];
    const p = quadPoint(skew, 0.25, 0.75);
    // Legacy formula spelled out:
    const [tl, tr, br, bl] = skew;
    const u = 0.25;
    const v = 0.75;
    const expected = {
      x: (1 - u) * (1 - v) * tl.x + u * (1 - v) * tr.x + u * v * br.x + (1 - u) * v * bl.x,
      y: (1 - u) * (1 - v) * tl.y + u * (1 - v) * tr.y + u * v * br.y + (1 - u) * v * bl.y,
    };
    expect(p.x).toBeCloseTo(expected.x);
    expect(p.y).toBeCloseTo(expected.y);
  });
});

describe('edge hit / resize / midpoint', () => {
  const rect: Quad = [
    { x: 0, y: 0 }, // TL
    { x: 100, y: 0 }, // TR
    { x: 100, y: 60 }, // BR
    { x: 0, y: 60 }, // BL
  ];

  it('findEdgeHit returns the right edge index', () => {
    expect(findEdgeHit(rect, { x: 50, y: 1 })).toBe(0); // top
    expect(findEdgeHit(rect, { x: 99, y: 30 })).toBe(1); // right
    expect(findEdgeHit(rect, { x: 50, y: 59 })).toBe(2); // bottom
    expect(findEdgeHit(rect, { x: 1, y: 30 })).toBe(3); // left
  });

  it('findEdgeHit ignores points near the corners', () => {
    // 5% along the top edge — within the 10% near-endpoint exclusion zone.
    expect(findEdgeHit(rect, { x: 5, y: 0 })).toBe(-1);
    expect(findEdgeHit(rect, { x: 95, y: 0 })).toBe(-1);
  });

  it('findEdgeHit returns -1 outside the proximity radius', () => {
    expect(findEdgeHit(rect, { x: 50, y: 30 })).toBe(-1); // middle of rect
    expect(findEdgeHit(rect, { x: 50, y: 200 })).toBe(-1); // far below
  });

  it('findEdgeHit accounts for view scale (zoom)', () => {
    // At 4× zoom, hit radius shrinks 4×, so a 4-px gap becomes a miss.
    expect(findEdgeHit(rect, { x: 50, y: 4 }, 1, 8)).toBe(0);
    expect(findEdgeHit(rect, { x: 50, y: 4 }, 4, 8)).toBe(-1);
  });

  it('resizeQuadEdge moves the right edge horizontally and keeps the rest', () => {
    const next = resizeQuadEdge(rect, 1, 20, 0);
    expect(next[0]).toEqual(rect[0]); // TL stays
    expect(next[3]).toEqual(rect[3]); // BL stays
    expect(next[1].x).toBeCloseTo(120); // TR moves right
    expect(next[2].x).toBeCloseTo(120); // BR moves right
    expect(next[1].y).toBeCloseTo(0);
    expect(next[2].y).toBeCloseTo(60);
  });

  it('resizeQuadEdge projects pointer delta onto the edge perpendicular', () => {
    // Drag right edge by (10, 30) — only the perpendicular (10) should land.
    const next = resizeQuadEdge(rect, 1, 10, 30);
    expect(next[1].x).toBeCloseTo(110);
    expect(next[2].x).toBeCloseTo(110);
    expect(next[1].y).toBeCloseTo(0);
    expect(next[2].y).toBeCloseTo(60);
  });

  it('resizeQuadEdge moves the top edge vertically', () => {
    const next = resizeQuadEdge(rect, 0, 0, -15); // pointer up
    expect(next[0].y).toBeCloseTo(-15);
    expect(next[1].y).toBeCloseTo(-15);
    expect(next[2]).toEqual(rect[2]);
    expect(next[3]).toEqual(rect[3]);
  });

  it('resizeQuadEdge returns input unchanged on invalid edge index', () => {
    expect(resizeQuadEdge(rect, 99, 5, 5)).toEqual(rect);
  });

  it('getEdgeMidpoint returns the midpoint of the requested edge', () => {
    expect(getEdgeMidpoint(rect, 0)).toEqual({ x: 50, y: 0 });
    expect(getEdgeMidpoint(rect, 1)).toEqual({ x: 100, y: 30 });
    expect(getEdgeMidpoint(rect, 2)).toEqual({ x: 50, y: 60 });
    expect(getEdgeMidpoint(rect, 3)).toEqual({ x: 0, y: 30 });
    expect(getEdgeMidpoint(rect, 99)).toBeNull();
  });
});
