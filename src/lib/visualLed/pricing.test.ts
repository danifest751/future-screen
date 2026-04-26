import { describe, expect, it } from 'vitest';
import {
  calculateAreaFromScreens,
  calculatePresetPrice,
  calculateProjectEstimate,
  formatRubPrice,
  roundPrice,
} from './pricing';
import { getPreset, VISUAL_LED_PRESETS } from './presets';

describe('calculateAreaFromScreens', () => {
  it('returns 0 for empty array', () => {
    expect(calculateAreaFromScreens([])).toBe(0);
  });

  it('sums width × height across screens', () => {
    expect(calculateAreaFromScreens([
      { widthM: 5, heightM: 3 },
      { widthM: 4, heightM: 2 },
    ])).toBe(23); // 15 + 8
  });

  it('ignores negative or non-numeric values', () => {
    expect(calculateAreaFromScreens([
      { widthM: 5, heightM: 3 },
      { widthM: -2, heightM: 5 },
      { widthM: NaN, heightM: 4 },
      { widthM: 4, heightM: 2 },
    ])).toBe(23);
  });

  it('rounds to 2 decimal places', () => {
    expect(calculateAreaFromScreens([{ widthM: 1.234, heightM: 2.345 }])).toBeCloseTo(2.89, 2);
  });
});

describe('roundPrice', () => {
  it('rounds to step (JS Math.round semantics: half rounds away from zero)', () => {
    // 52500 / 5000 = 10.5 → Math.round = 11 → 55000
    expect(roundPrice(52_500, 5_000)).toBe(55_000);
    expect(roundPrice(57_500, 5_000)).toBe(60_000);
    expect(roundPrice(119_300, 5_000)).toBe(120_000);
    expect(roundPrice(1_202_000, 10_000)).toBe(1_200_000);
  });

  it('returns 0 for negative or zero', () => {
    expect(roundPrice(0, 5_000)).toBe(0);
    expect(roundPrice(-100, 5_000)).toBe(0);
    expect(roundPrice(NaN, 5_000)).toBe(0);
  });

  it('clamps step to 1 minimum', () => {
    expect(roundPrice(123, 0)).toBe(123);
    expect(roundPrice(123, -100)).toBe(123);
  });
});

describe('calculatePresetPrice', () => {
  it('uses preset reference area by default', () => {
    const compact = getPreset('compact')!;
    // 30000 + 15 × 1500 × 1.0 = 52 500 → /5000 = 10.5 → round = 11 → 55 000
    expect(calculatePresetPrice(compact)).toBe(55_000);

    const concert = getPreset('concert')!;
    // 80000 + 60 × 2200 × 1.3 = 251 600 → round 10k → 250 000
    expect(calculatePresetPrice(concert)).toBe(250_000);

    const flagship = getPreset('flagship')!;
    // 250000 + 200 × 2800 × 1.7 = 1 202 000 → round 10k → 1 200 000
    expect(calculatePresetPrice(flagship)).toBe(1_200_000);
  });

  it('accepts area override (real screen area)', () => {
    const concert = getPreset('concert')!;
    // 80000 + 100 × 2200 × 1.3 = 366 000 → round 10k → 370 000
    expect(calculatePresetPrice(concert, 100)).toBe(370_000);
  });
});

describe('calculateProjectEstimate', () => {
  it('preset only, no screens → from preset reference area, isEstimated=true', () => {
    const result = calculateProjectEstimate('concert', []);
    expect(result.priceFrom).toBe(250_000);
    expect(result.areaM2).toBe(60);
    expect(result.presetSlug).toBe('concert');
    expect(result.isEstimated).toBe(true);
  });

  it('preset + screens → uses real area, isEstimated=false', () => {
    const result = calculateProjectEstimate('concert', [
      { widthM: 8, heightM: 4 },
      { widthM: 8, heightM: 4 },
    ]);
    // area = 64; 80000 + 64 × 2200 × 1.3 = 263 040 → round 10k → 260 000
    expect(result.priceFrom).toBe(260_000);
    expect(result.areaM2).toBe(64);
    expect(result.presetSlug).toBe('concert');
    expect(result.isEstimated).toBe(false);
  });

  it('screens without preset → uses cheapest pricePerM2 baseline, isEstimated=false', () => {
    const result = calculateProjectEstimate(null, [{ widthM: 5, heightM: 3 }]);
    expect(result.areaM2).toBe(15);
    expect(result.presetSlug).toBeNull();
    expect(result.isEstimated).toBe(false);
    expect(result.priceFrom).toBeGreaterThan(0);
  });

  it('truly empty → cheapest preset floor, isEstimated=true', () => {
    const result = calculateProjectEstimate(null, []);
    expect(result.priceFrom).toBe(55_000); // cheapest by basePrice = compact preset
    expect(result.presetSlug).toBeNull();
    expect(result.isEstimated).toBe(true);
  });

  it('unknown preset slug behaves like null preset', () => {
    const result = calculateProjectEstimate('does-not-exist', []);
    expect(result.presetSlug).toBeNull();
  });

  it('5 known presets all produce strictly ascending prices', () => {
    const prices = VISUAL_LED_PRESETS.map((p) =>
      calculateProjectEstimate(p.slug, []).priceFrom,
    );
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
    expect(new Set(prices).size).toBe(prices.length); // no duplicates
  });
});

describe('formatRubPrice', () => {
  it('groups thousands with non-breaking spaces', () => {
    expect(formatRubPrice(250_000)).toBe('250\u00a0000\u00a0₽');
    expect(formatRubPrice(1_200_000)).toBe('1\u00a0200\u00a0000\u00a0₽');
    expect(formatRubPrice(50_000)).toBe('50\u00a0000\u00a0₽');
    expect(formatRubPrice(999)).toBe('999\u00a0₽');
  });

  it('adds "от" prefix when requested', () => {
    expect(formatRubPrice(250_000, true)).toBe('от\u00a0250\u00a0000\u00a0₽');
  });

  it('handles 0 and negative gracefully', () => {
    expect(formatRubPrice(0)).toBe('0\u00a0₽');
    expect(formatRubPrice(-100)).toBe('0\u00a0₽');
  });

  it('rounds non-integer input', () => {
    expect(formatRubPrice(250_000.7)).toBe('250\u00a0001\u00a0₽');
  });
});
