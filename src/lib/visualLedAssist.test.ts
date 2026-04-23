import { describe, expect, it } from 'vitest';
import {
  analyzeAssistFromImageData,
  angleToDeg,
  averageAngles,
  buildAssistFromFallback,
  degDistance,
  lineClipToRect,
  normalizeAngleDeg,
  polarLineFromDeg,
  radFromDeg,
} from './visualLedAssist';

function drawLine(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const idx = (y * width + x) * 4;
    data[idx] = 255;
    data[idx + 1] = 255;
    data[idx + 2] = 255;
    data[idx + 3] = 255;
  }
}

function buildSyntheticTrapezoidImage(width = 300, height = 200) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i + 3] = 255;
  }

  drawLine(data, width, height, 80, 55, 230, 70);
  drawLine(data, width, height, 230, 70, 250, 155);
  drawLine(data, width, height, 250, 155, 70, 150);
  drawLine(data, width, height, 70, 150, 80, 55);

  return { width, height, data };
}

describe('visualLedAssist analyze', () => {
  it('returns fallback on blank image', () => {
    const width = 180;
    const height = 120;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) data[i + 3] = 255;
    const result = analyzeAssistFromImageData({ width, height, data });
    expect(result.source).toBe('fallback');
    expect(result.confidence).toBe('low');
    expect(result.corners).toHaveLength(4);
  });

  it('detects usable quadrilateral on synthetic edges', () => {
    const image = buildSyntheticTrapezoidImage();
    const result = analyzeAssistFromImageData(image);
    expect(result.source).toBe('auto');
    expect(result.guides.length).toBeGreaterThanOrEqual(4);
    expect(result.corners).toHaveLength(4);
    for (const point of result.corners) {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
    }
  });
});

describe('visualLedAssist helpers', () => {
  it('clips polar line to rectangle', () => {
    const line = polarLineFromDeg(0, 40);
    const clipped = lineClipToRect(line, 120, 80);
    expect(clipped).not.toBeNull();
    const [a, b] = clipped!;
    expect(a.y).toBeCloseTo(40, 0);
    expect(b.y).toBeCloseTo(40, 0);
  });

  it('computes circular mean for 180-periodic angles', () => {
    const avg = averageAngles([2, 178]);
    expect(avg).not.toBeNull();
    expect(degDistance(avg!, 0)).toBeLessThan(5);
  });

  it('returns null clipping when line does not intersect rectangle', () => {
    const clipped = lineClipToRect({ nx: 0, ny: 1, d: 200 }, 120, 80);
    expect(clipped).toBeNull();
  });

  it('handles angle conversion helpers consistently', () => {
    expect(radFromDeg(180)).toBeCloseTo(Math.PI);
    expect(angleToDeg(Math.PI / 2)).toBeCloseTo(90);
    expect(normalizeAngleDeg(190)).toBe(10);
    expect(normalizeAngleDeg(-10)).toBe(170);
  });

  it('returns null for empty and opposite-direction angle averages', () => {
    expect(averageAngles([])).toBeNull();
    expect(averageAngles([0, 90])).toBeNull();
  });

  it('builds deterministic fallback assist payload', () => {
    const assist = buildAssistFromFallback(300, 200);
    expect(assist.source).toBe('fallback');
    expect(assist.confidence).toBe('low');
    expect(assist.corners).toHaveLength(4);
    expect(assist.guides).toEqual([]);
  });
});
