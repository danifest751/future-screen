import { describe, it, expect } from 'vitest';
import {
  getPixelsPerCabinetSide,
  normalizePitch,
  getElementSizeMeters,
  autoFillCabinets,
  tweakCols,
  tweakRows,
  getCabinetStats,
  getCabinetResourceSpec,
  getCabinetResourceStats,
  cabinetsToTargetSize,
} from './cabinet';
import type { CabinetPlan, Quad, ScaleCalibration } from './types';

const scale: ScaleCalibration = { realLength: 2, pxLength: 200, pxPerMeter: 100 };

const quad: Quad = [
  { x: 0, y: 0 },
  { x: 400, y: 0 }, // 4m wide
  { x: 400, y: 200 }, // 2m tall
  { x: 0, y: 200 },
];

describe('pitch', () => {
  it('getPixelsPerCabinetSide defaults to 2.6 when unknown', () => {
    expect(getPixelsPerCabinetSide('2.6')).toBe(192);
    expect(getPixelsPerCabinetSide('1.9')).toBe(256);
    expect(getPixelsPerCabinetSide(undefined)).toBe(192);
    expect(getPixelsPerCabinetSide('99')).toBe(192);
  });

  it('normalizePitch only accepts 1.9 or 2.6', () => {
    expect(normalizePitch('1.9')).toBe('1.9');
    expect(normalizePitch('2.6')).toBe('2.6');
    expect(normalizePitch('3.0')).toBe('2.6');
    expect(normalizePitch(undefined)).toBe('2.6');
  });

  it('exposes per-cabinet resource specs by pitch', () => {
    expect(getCabinetResourceSpec('1.9')).toMatchObject({
      weightMinKg: 7,
      weightMaxKg: 9,
      maxPowerW: 200,
      averagePowerW: 70,
    });
    expect(getCabinetResourceSpec('2.6')).toMatchObject({
      weightMinKg: 6,
      weightMaxKg: 8,
      maxPowerW: 160,
      averagePowerW: 55,
    });
  });
});

describe('getElementSizeMeters', () => {
  it('returns null without scale or corners', () => {
    expect(getElementSizeMeters(quad, null)).toBeNull();
    expect(getElementSizeMeters(null, scale)).toBeNull();
  });

  it('averages opposite edges for non-rectangular quads', () => {
    const size = getElementSizeMeters(quad, scale);
    expect(size).not.toBeNull();
    expect(size!.width).toBeCloseTo(4);
    expect(size!.height).toBeCloseTo(2);
  });
});

describe('autoFillCabinets', () => {
  it('returns the exact full-cabinet count when the screen is a multiple of cabinet side', () => {
    const plan = autoFillCabinets({ width: 4, height: 2 }, '2.6');
    expect(plan.cols).toBe(8);
    expect(plan.rows).toBe(4);
    expect(plan.cabinetSide).toBe(0.5);
    expect(plan.pitch).toBe('2.6');
  });

  it('drops the partial cabinet that would overflow the declared screen area', () => {
    // 2.7 m wide → 5 full cabinets (= 2.5 m), NOT 6 (= 3 m would overflow).
    const plan = autoFillCabinets({ width: 2.7, height: 2.7 }, '2.6');
    expect(plan.cols).toBe(5);
    expect(plan.rows).toBe(5);
  });

  it('absorbs sub-cm slack from manual corner placement (within tolerance)', () => {
    // 4.99 m → user clearly meant 5 m (10 cabinets), not 9.
    const plan = autoFillCabinets({ width: 4.99, height: 4.99 }, '2.6');
    expect(plan.cols).toBe(10);
    expect(plan.rows).toBe(10);
  });

  it('never returns 0 cols/rows for tiny sizes', () => {
    const plan = autoFillCabinets({ width: 0.1, height: 0.1 }, '1.9');
    expect(plan.cols).toBe(1);
    expect(plan.rows).toBe(1);
    expect(plan.pitch).toBe('1.9');
  });
});

describe('tweak plan', () => {
  const base: CabinetPlan = { cols: 4, rows: 2, cabinetSide: 0.5, pitch: '2.6' };

  it('clamps cols >= 1', () => {
    expect(tweakCols(base, 1).cols).toBe(5);
    expect(tweakCols(base, -10).cols).toBe(1);
  });

  it('clamps rows >= 1', () => {
    expect(tweakRows(base, 2).rows).toBe(4);
    expect(tweakRows(base, -5).rows).toBe(1);
  });

  it('returns a new object (no mutation)', () => {
    const next = tweakCols(base, 1);
    expect(base.cols).toBe(4);
    expect(next.cols).toBe(5);
    expect(next).not.toBe(base);
  });
});

describe('getCabinetStats', () => {
  const size = { width: 4, height: 2 };
  const plan: CabinetPlan = { cols: 8, rows: 4, cabinetSide: 0.5, pitch: '2.6' };

  it('returns null without plan or size', () => {
    expect(getCabinetStats(null, size)).toBeNull();
    expect(getCabinetStats(plan, null)).toBeNull();
  });

  it('computes counts and pixel dims at 2.6 pitch', () => {
    const stats = getCabinetStats(plan, size)!;
    expect(stats.totalCount).toBe(32);
    expect(stats.inBoundsCount).toBe(32);
    expect(stats.overflowCount).toBe(0);
    expect(stats.pixelWidth).toBe(8 * 192);
    expect(stats.pixelHeight).toBe(4 * 192);
    expect(stats.usedWidth).toBe(4);
    expect(stats.usedHeight).toBe(2);
    expect(stats.weightMinKg).toBe(192);
    expect(stats.weightMaxKg).toBe(256);
    expect(stats.maxPowerW).toBe(5120);
    expect(stats.averagePowerW).toBe(1760);
  });

  it('counts overflow when plan exceeds physical size', () => {
    const overflowPlan: CabinetPlan = { cols: 10, rows: 4, cabinetSide: 0.5, pitch: '2.6' };
    const stats = getCabinetStats(overflowPlan, size)!;
    expect(stats.totalCount).toBe(40);
    expect(stats.inBoundsCount).toBe(32);
    expect(stats.overflowCount).toBe(8);
    expect(stats.overflowWidth).toBeCloseTo(1);
    expect(stats.overflowHeight).toBe(0);
  });

  it('switches pixel dims by pitch', () => {
    const plan19: CabinetPlan = { cols: 4, rows: 2, cabinetSide: 0.5, pitch: '1.9' };
    const stats = getCabinetStats(plan19, { width: 2, height: 1 })!;
    expect(stats.pixelWidth).toBe(4 * 256);
    expect(stats.pixelHeight).toBe(2 * 256);
    expect(stats.weightMinKg).toBe(56);
    expect(stats.weightMaxKg).toBe(72);
    expect(stats.maxPowerW).toBe(1600);
    expect(stats.averagePowerW).toBe(560);
  });

  it('applies 1.5cm tolerance for near-boundary fits', () => {
    // size is slightly less than needed, but tolerance should still keep everything in bounds.
    const tightSize = { width: 1.99, height: 1 };
    const tightPlan: CabinetPlan = { cols: 4, rows: 2, cabinetSide: 0.5, pitch: '2.6' };
    const stats = getCabinetStats(tightPlan, tightSize)!;
    expect(stats.inBoundsCount).toBe(8);
    expect(stats.overflowCount).toBe(0);
  });
});

describe('getCabinetResourceStats', () => {
  it('computes resource totals even without screen metric size', () => {
    const plan: CabinetPlan = { cols: 3, rows: 2, cabinetSide: 0.5, pitch: '1.9' };
    expect(getCabinetResourceStats(plan)).toMatchObject({
      weightMinKg: 42,
      weightMaxKg: 54,
      maxPowerW: 1200,
      averagePowerW: 420,
    });
  });
});

describe('cabinetsToTargetSize', () => {
  it('multiplies cols/rows by cabinet side', () => {
    const plan: CabinetPlan = { cols: 6, rows: 3, cabinetSide: 0.5, pitch: '2.6' };
    expect(cabinetsToTargetSize(plan)).toEqual({ width: 3, height: 1.5 });
  });
});
