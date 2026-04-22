import { describe, it, expect } from 'vitest';
import { scaleQuadToMetric, quadToMetric, translateQuad, moveCorner } from './screenOps';
import type { Quad, ScaleCalibration } from './types';

const scale: ScaleCalibration = { realLength: 2, pxLength: 200, pxPerMeter: 100 };

const rect: Quad = [
  { x: 0, y: 0 },
  { x: 400, y: 0 },
  { x: 400, y: 200 },
  { x: 0, y: 200 },
];

describe('scaleQuadToMetric', () => {
  it('doubles width and halves height on an axis-aligned rectangle', () => {
    const next = scaleQuadToMetric(rect, { width: 4, height: 2 }, { width: 8, height: 1 });
    // Centre preserved at (200, 100)
    const cx = next.reduce((s, p) => s + p.x, 0) / 4;
    const cy = next.reduce((s, p) => s + p.y, 0) / 4;
    expect(cx).toBeCloseTo(200);
    expect(cy).toBeCloseTo(100);
    // New width: 8m * 100 px/m = 800 px across the midline
    const newTop = Math.hypot(next[1].x - next[0].x, next[1].y - next[0].y);
    expect(newTop).toBeCloseTo(800);
    const newLeft = Math.hypot(next[3].x - next[0].x, next[3].y - next[0].y);
    expect(newLeft).toBeCloseTo(100);
  });

  it('returns the original corners if current size is 0', () => {
    const next = scaleQuadToMetric(rect, { width: 0, height: 2 }, { width: 8, height: 1 });
    expect(next).toBe(rect);
  });

  it('leaves the quad unchanged when sx=sy=1', () => {
    const next = scaleQuadToMetric(rect, { width: 4, height: 2 }, { width: 4, height: 2 });
    for (let i = 0; i < 4; i += 1) {
      expect(next[i].x).toBeCloseTo(rect[i].x);
      expect(next[i].y).toBeCloseTo(rect[i].y);
    }
  });
});

describe('quadToMetric', () => {
  it('measures all four edges at 100 px/m', () => {
    const m = quadToMetric(rect, scale);
    expect(m.widthTop).toBeCloseTo(4);
    expect(m.widthBottom).toBeCloseTo(4);
    expect(m.heightLeft).toBeCloseTo(2);
    expect(m.heightRight).toBeCloseTo(2);
  });
});

describe('translateQuad', () => {
  it('shifts every corner by the delta', () => {
    const next = translateQuad(rect, 10, -5);
    expect(next[0]).toEqual({ x: 10, y: -5 });
    expect(next[2]).toEqual({ x: 410, y: 195 });
  });
});

describe('moveCorner', () => {
  it('moves the specified corner and preserves the rest', () => {
    const next = moveCorner(rect, 1, { x: 500, y: 10 });
    expect(next[0]).toEqual(rect[0]);
    expect(next[1]).toEqual({ x: 500, y: 10 });
    expect(next[2]).toEqual(rect[2]);
  });

  it('returns the original quad on out-of-range index', () => {
    expect(moveCorner(rect, -1, { x: 0, y: 0 })).toBe(rect);
    expect(moveCorner(rect, 4, { x: 0, y: 0 })).toBe(rect);
  });
});
