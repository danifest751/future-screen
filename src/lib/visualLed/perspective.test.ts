import { describe, it, expect, vi } from 'vitest';
import {
  drawSourceTriangle,
  drawWarpedSource,
  solveAffineForTriangle,
  type AffineMatrix,
} from './perspective';

/** Apply a solved matrix to a point (same semantics as canvas.transform). */
function applyMatrix(m: AffineMatrix, p: { x: number; y: number }) {
  return {
    x: m.a * p.x + m.c * p.y + m.e,
    y: m.b * p.x + m.d * p.y + m.f,
  };
}

describe('solveAffineForTriangle', () => {
  it('returns identity when source == destination', () => {
    const s0 = { x: 0, y: 0 };
    const s1 = { x: 1, y: 0 };
    const s2 = { x: 0, y: 1 };
    const m = solveAffineForTriangle(s0, s1, s2, s0, s1, s2);
    expect(m).not.toBeNull();
    expect(m!.a).toBeCloseTo(1);
    expect(m!.b).toBeCloseTo(0);
    expect(m!.c).toBeCloseTo(0);
    expect(m!.d).toBeCloseTo(1);
    expect(m!.e).toBeCloseTo(0);
    expect(m!.f).toBeCloseTo(0);
  });

  it('maps source triangle exactly onto destination triangle', () => {
    const s0 = { x: 0, y: 0 };
    const s1 = { x: 10, y: 0 };
    const s2 = { x: 0, y: 10 };
    const d0 = { x: 100, y: 50 };
    const d1 = { x: 200, y: 80 };
    const d2 = { x: 130, y: 150 };
    const m = solveAffineForTriangle(s0, s1, s2, d0, d1, d2)!;
    expect(applyMatrix(m, s0).x).toBeCloseTo(d0.x);
    expect(applyMatrix(m, s0).y).toBeCloseTo(d0.y);
    expect(applyMatrix(m, s1).x).toBeCloseTo(d1.x);
    expect(applyMatrix(m, s1).y).toBeCloseTo(d1.y);
    expect(applyMatrix(m, s2).x).toBeCloseTo(d2.x);
    expect(applyMatrix(m, s2).y).toBeCloseTo(d2.y);
  });

  it('returns null for a degenerate (collinear) source triangle', () => {
    const s0 = { x: 0, y: 0 };
    const s1 = { x: 1, y: 0 };
    const s2 = { x: 2, y: 0 }; // collinear
    const d0 = { x: 0, y: 0 };
    const d1 = { x: 10, y: 0 };
    const d2 = { x: 20, y: 1 };
    expect(solveAffineForTriangle(s0, s1, s2, d0, d1, d2)).toBeNull();
  });
});

describe('perspective canvas helpers', () => {
  const createCtx = () =>
    ({
      save: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      clip: vi.fn(),
      transform: vi.fn(),
      drawImage: vi.fn(),
      restore: vi.fn(),
    }) as unknown as CanvasRenderingContext2D;

  it('drawSourceTriangle is no-op for degenerate source triangle', () => {
    const ctx = createCtx();
    drawSourceTriangle(
      ctx,
      {} as CanvasImageSource,
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
    );
    expect((ctx as any).drawImage).not.toHaveBeenCalled();
  });

  it('drawSourceTriangle applies transform and draws source for valid triangle', () => {
    const ctx = createCtx();
    const source = { width: 100, height: 60 } as unknown as CanvasImageSource & {
      width: number;
      height: number;
    };
    drawSourceTriangle(
      ctx,
      source,
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 60 },
      { x: 10, y: 10 },
      { x: 110, y: 20 },
      { x: 20, y: 70 },
    );
    expect((ctx as any).transform).toHaveBeenCalledTimes(1);
    expect((ctx as any).drawImage).toHaveBeenCalledWith(source, 0, 0);
  });

  it('drawWarpedSource skips drawing when source has no size', () => {
    const ctx = createCtx();
    drawWarpedSource(
      ctx,
      {} as unknown as CanvasImageSource & {
        videoWidth?: number;
        videoHeight?: number;
        naturalWidth?: number;
        naturalHeight?: number;
        width?: number;
        height?: number;
      },
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    );
    expect((ctx as any).drawImage).not.toHaveBeenCalled();
  });

  it('drawWarpedSource splits quad into two triangles for 1x1 grid', () => {
    const ctx = createCtx();
    const source = { width: 120, height: 80 } as unknown as CanvasImageSource & {
      width: number;
      height: number;
    };
    drawWarpedSource(
      ctx,
      source,
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
      1,
      1,
    );
    expect((ctx as any).drawImage).toHaveBeenCalledTimes(2);
  });
});
