import { describe, it, expect } from 'vitest';
import {
  getLumaAt,
  collectAssistSamples,
  dominantAssistAngles,
  linesForAssistAngle,
  refineCornersByEdgeSnap,
  isAssistQuadUsable,
  fallbackAssistCorners,
  getAssistRoi,
} from './assist';
import type { Quad } from './types';

/** Build a synthetic RGBA ImageData-like buffer for tests (no DOM). */
function makeImageData(width: number, height: number, filler: (x: number, y: number) => [number, number, number]): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = filler(x, y);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  // Construct a plain object matching the ImageData shape without needing DOM.
  return { data, width, height, colorSpace: 'srgb' } as ImageData;
}

describe('getLumaAt', () => {
  it('computes Rec. 709 luma', () => {
    const data = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
    expect(getLumaAt(data, 2, 0, 0)).toBeCloseTo(255);
    expect(getLumaAt(data, 2, 1, 0)).toBeCloseTo(0);
  });

  it('treats out-of-range reads as 0', () => {
    const data = new Uint8ClampedArray(4);
    expect(getLumaAt(data, 1, 5, 5)).toBe(0);
  });
});

describe('collectAssistSamples', () => {
  it('finds no edges in a flat image', () => {
    const img = makeImageData(32, 32, () => [128, 128, 128]);
    expect(collectAssistSamples(img)).toHaveLength(0);
  });

  it('finds edges along a sharp horizontal boundary', () => {
    const img = makeImageData(32, 32, (_x, y) => (y < 16 ? [255, 255, 255] : [0, 0, 0]));
    const samples = collectAssistSamples(img);
    expect(samples.length).toBeGreaterThan(0);
    // All samples should lie on the boundary (y = 15 or 16 roughly).
    const ys = samples.map((s) => s.y);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(14);
    expect(Math.max(...ys)).toBeLessThanOrEqual(17);
  });
});

describe('dominantAssistAngles', () => {
  it('returns null on too few samples', () => {
    expect(dominantAssistAngles([])).toBeNull();
  });

  it('returns two angles >= 20° apart for a rectangle-shaped sample set', () => {
    // Synthetic: 200 samples at angle 0, 100 at angle π/2, plus some noise.
    const samples = [
      ...Array.from({ length: 200 }, (_, i) => ({ x: i, y: 0, angle: 0, mag: 100 })),
      ...Array.from({ length: 100 }, (_, i) => ({ x: 0, y: i, angle: Math.PI / 2, mag: 100 })),
    ];
    const result = dominantAssistAngles(samples);
    expect(result).not.toBeNull();
    const [a, b] = result!;
    const sep = Math.abs(a - b);
    expect(sep).toBeGreaterThanOrEqual((20 * Math.PI) / 180);
  });
});

describe('linesForAssistAngle', () => {
  it('returns null when not enough oriented samples', () => {
    expect(linesForAssistAngle([], 0)).toBeNull();
  });

  it('returns two line candidates for a strong orientation family', () => {
    const samples = [
      ...Array.from({ length: 60 }, (_, i) => ({
        x: i,
        y: i < 30 ? 10 : 40,
        angle: 0,
        mag: 100,
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        x: i,
        y: i,
        angle: Math.PI / 2,
        mag: 10,
      })),
    ];

    const lines = linesForAssistAngle(samples as any, 0);
    expect(lines).not.toBeNull();
    expect(lines![0].ny).toBeCloseTo(1, 3);
    expect(lines![1].ny).toBeCloseTo(1, 3);
    expect(lines![0].d).toBeLessThan(lines![1].d);
  });
});

describe('refineCornersByEdgeSnap', () => {
  it('returns null when corners are missing or samples too few', () => {
    const quad: Quad = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(refineCornersByEdgeSnap(quad, [])).toBeNull();
    expect(refineCornersByEdgeSnap(null, [])).toBeNull();
  });

  it('returns refined corners when edge samples indicate shifted boundaries', () => {
    const quad: Quad = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ];

    const samples = [
      ...Array.from({ length: 51 }, (_, i) => ({ x: i * 2, y: 2, angle: 0, mag: 100 })),
      ...Array.from({ length: 51 }, (_, i) => ({ x: i * 2, y: 52, angle: 0, mag: 100 })),
      ...Array.from({ length: 30 }, (_, i) => ({ x: 2, y: i * 2, angle: Math.PI / 2, mag: 100 })),
      ...Array.from({ length: 30 }, (_, i) => ({ x: 102, y: i * 2, angle: Math.PI / 2, mag: 100 })),
    ];

    const result = refineCornersByEdgeSnap(quad, samples as any);
    expect(result).not.toBeNull();
    expect(result?.corners).toHaveLength(4);
    expect(result?.avgMove).toBeGreaterThan(0.75);
    expect(result?.lines).toHaveLength(4);
  });

  it('returns null when one edge has insufficient support samples', () => {
    const quad: Quad = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ];

    const samples = [
      ...Array.from({ length: 51 }, (_, i) => ({ x: i * 2, y: 0, angle: 0, mag: 100 })),
      ...Array.from({ length: 51 }, (_, i) => ({ x: i * 2, y: 50, angle: 0, mag: 100 })),
      ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i * 2, angle: Math.PI / 2, mag: 100 })),
      ...Array.from({ length: 8 }, (_, i) => ({ x: 100, y: i * 2, angle: Math.PI / 2, mag: 100 })),
    ];

    expect(refineCornersByEdgeSnap(quad, samples as any)).toBeNull();
  });
});

describe('isAssistQuadUsable', () => {
  const bounds = { width: 100, height: 100 };
  it('accepts quads of reasonable size inside the bounds', () => {
    const quad: Quad = [
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 90 },
      { x: 10, y: 90 },
    ];
    expect(isAssistQuadUsable(quad, bounds)).toBe(true);
  });

  it('rejects quads smaller than 1% of bounds', () => {
    const quad: Quad = [
      { x: 10, y: 10 },
      { x: 12, y: 10 },
      { x: 12, y: 12 },
      { x: 10, y: 12 },
    ];
    expect(isAssistQuadUsable(quad, bounds)).toBe(false);
  });

  it('rejects quads larger than 90% of bounds', () => {
    const quad: Quad = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    expect(isAssistQuadUsable(quad, bounds)).toBe(false);
  });

  it('rejects quads with corners far outside bounds', () => {
    const quad: Quad = [
      { x: -50, y: 10 },
      { x: 50, y: 10 },
      { x: 50, y: 50 },
      { x: -50, y: 50 },
    ];
    expect(isAssistQuadUsable(quad, bounds)).toBe(false);
  });
});

describe('fallbackAssistCorners', () => {
  it('returns a centred rectangle if no base', () => {
    const corners = fallbackAssistCorners(100, 100);
    expect(corners).toHaveLength(4);
    // Roughly centred — exact values derived from the fractions 0.32/0.68/0.33/0.72/...
    const avgX = corners.reduce((s, p) => s + p.x, 0) / 4;
    const avgY = corners.reduce((s, p) => s + p.y, 0) / 4;
    expect(avgX).toBeGreaterThan(40);
    expect(avgX).toBeLessThan(60);
    expect(avgY).toBeGreaterThan(40);
    expect(avgY).toBeLessThan(60);
  });

  it('clones the baseCorners if provided (no aliasing)', () => {
    const base: Quad = [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      { x: 5, y: 6 },
      { x: 7, y: 8 },
    ];
    const out = fallbackAssistCorners(100, 100, base);
    expect(out).toEqual(base);
    expect(out[0]).not.toBe(base[0]);
  });
});

describe('getAssistRoi', () => {
  it('returns full canvas when no target', () => {
    expect(getAssistRoi(null, 1280, 720)).toEqual({ x: 0, y: 0, width: 1280, height: 720 });
  });

  it('pads around target corners without overflowing canvas', () => {
    const quad: Quad = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 200 },
      { x: 100, y: 200 },
    ];
    const roi = getAssistRoi(quad, 1000, 1000);
    expect(roi.x).toBeLessThan(100);
    expect(roi.y).toBeLessThan(100);
    expect(roi.width).toBeGreaterThan(100);
    expect(roi.height).toBeGreaterThan(100);
    expect(roi.x + roi.width).toBeLessThanOrEqual(1000);
    expect(roi.y + roi.height).toBeLessThanOrEqual(1000);
  });
});
