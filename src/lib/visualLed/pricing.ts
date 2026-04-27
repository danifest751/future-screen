// Pure pricing for the Visual LED sales configurator.
//
// Inputs:
//   - the user's screens (in meters), if any have been placed yet,
//   - the active preset (its area is the fallback when no screens exist).
//
// Output is always "from N ₽ / day" — explicitly framed as an estimate,
// never an offer. Final price is settled by sales after the lead arrives.
//
// No React, no Supabase, no DOM — this module is fully testable.

import { VISUAL_LED_PRESETS, type VisualLedPreset, type VisualLedPresetSlug } from './presets';

export interface ScreenDimensions {
  widthM: number;
  heightM: number;
}

export interface ProjectEstimate {
  /** Rounded price in ₽ for the "from N ₽ / day" badge. */
  priceFrom: number;
  /** Total LED area used in the calculation (preset fallback OR sum of screens). */
  areaM2: number;
  /** Slug of the preset used for the multiplier; null when no preset selected. */
  presetSlug: VisualLedPresetSlug | null;
  /**
   * `true` when the price came from the preset's reference area (no screens
   * placed yet). `false` when the user has actually positioned screens and
   * we're summing their real area.
   */
  isEstimated: boolean;
}

const safeNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/** Sum of widthM × heightM across an array of screens, ignoring negatives. */
export const calculateAreaFromScreens = (screens: readonly ScreenDimensions[]): number => {
  let total = 0;
  for (const s of screens) {
    const w = safeNumber(s.widthM);
    const h = safeNumber(s.heightM);
    total += w * h;
  }
  return Math.round(total * 100) / 100;
};

/** Round `value` to the nearest `step` (step ≥ 1). Negative values clamp to 0. */
export const roundPrice = (value: number, step: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const safeStep = Math.max(1, Math.floor(step));
  return Math.round(value / safeStep) * safeStep;
};

/** Apply the preset's formula to a given area; can override area for "what if X m²". */
export const calculatePresetPrice = (preset: VisualLedPreset, areaM2?: number): number => {
  const area = areaM2 !== undefined ? safeNumber(areaM2, preset.areaM2) : preset.areaM2;
  const raw = preset.basePrice + area * preset.pricePerM2 * preset.eventMultiplier;
  return roundPrice(raw, preset.roundStep);
};

/**
 * Main entry point. Takes whatever the visualizer currently has — a preset
 * choice and/or some placed screens — and returns the headline estimate.
 *
 *   • preset only, no screens   → estimate from preset's reference area  (isEstimated = true)
 *   • preset + screens          → estimate from real area, preset multiplier  (isEstimated = false)
 *   • screens, no preset        → estimate using the smallest active preset's coefficients  (isEstimated = false)
 *   • nothing                   → cheapest preset's "from" price as a floor  (isEstimated = true)
 *
 * Pass `presets` from `useVisualLedConfig()` to use DB-driven values;
 * omit to fall back to the hardcoded constants.
 */
export const calculateProjectEstimate = (
  presetSlug: string | null | undefined,
  screens: readonly ScreenDimensions[] = [],
  presets: readonly VisualLedPreset[] = VISUAL_LED_PRESETS,
): ProjectEstimate => {
  const preset = presets.find((p) => p.slug === presetSlug) ?? null;
  const realArea = calculateAreaFromScreens(screens);
  const hasScreens = realArea > 0;

  if (preset && hasScreens) {
    return {
      priceFrom: calculatePresetPrice(preset, realArea),
      areaM2: realArea,
      presetSlug: preset.slug,
      isEstimated: false,
    };
  }

  if (preset) {
    return {
      priceFrom: calculatePresetPrice(preset),
      areaM2: preset.areaM2,
      presetSlug: preset.slug,
      isEstimated: true,
    };
  }

  if (hasScreens) {
    const cheapest = [...presets].reduce((min, p) =>
      p.pricePerM2 < min.pricePerM2 ? p : min,
    );
    return {
      priceFrom: calculatePresetPrice(cheapest, realArea),
      areaM2: realArea,
      presetSlug: null,
      isEstimated: false,
    };
  }

  const cheapest = [...presets].reduce((min, p) =>
    p.basePrice < min.basePrice ? p : min,
  );
  return {
    priceFrom: calculatePresetPrice(cheapest),
    areaM2: cheapest.areaM2,
    presetSlug: null,
    isEstimated: true,
  };
};

// Non-breaking space (U+00A0). Written as Unicode escape so eslint's
// no-irregular-whitespace rule doesn't trip on the literal byte.
// \u2500\u2500 Multi-day discount \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

/**
 * One row from `visual_led_day_discounts`.
 * `isLastTier = true` means this row is the catch-all for day_number and above.
 */
export interface DayDiscount {
  dayNumber: number;
  discountPercent: number;
  labelRu: string;
  isLastTier: boolean;
}

/** Hardcoded fallback used when the DB is unavailable. */
export const FALLBACK_DAY_DISCOUNTS: readonly DayDiscount[] = [
  { dayNumber: 1, discountPercent:  0, labelRu: '\u0414\u0435\u043d\u044c 1',  isLastTier: false },
  { dayNumber: 2, discountPercent: 20, labelRu: '\u0414\u0435\u043d\u044c 2',  isLastTier: false },
  { dayNumber: 3, discountPercent: 30, labelRu: '\u0414\u0435\u043d\u044c 3',  isLastTier: false },
  { dayNumber: 4, discountPercent: 40, labelRu: '\u0414\u0435\u043d\u044c 4+', isLastTier: true  },
];

/**
 * Returns the discount percent (0\u201399) applicable to a given rental day.
 * Days are 1-indexed. The last-tier row catches everything beyond its day_number.
 */
export const getDayDiscount = (
  day: number,
  discounts: readonly DayDiscount[] = FALLBACK_DAY_DISCOUNTS,
): number => {
  if (!discounts.length || day < 1) return 0;
  const sorted = [...discounts].sort((a, b) => a.dayNumber - b.dayNumber);
  const exact = sorted.find((d) => d.dayNumber === day);
  if (exact) return exact.discountPercent;
  const lastTier = [...sorted].reverse().find((d) => d.isLastTier);
  if (lastTier && day >= lastTier.dayNumber) return lastTier.discountPercent;
  return 0;
};

export interface DayBreakdown {
  day: number;
  pricePerDay: number;
  discountPercent: number;
}

/**
 * Total price and per-day breakdown for a multi-day rental.
 * Uses the base single-day price and applies day-specific discounts.
 */
export const calculateMultiDayPrice = (
  pricePerDay: number,
  days: number,
  discounts: readonly DayDiscount[] = FALLBACK_DAY_DISCOUNTS,
): { total: number; breakdown: readonly DayBreakdown[] } => {
  const safeDays = Math.max(1, Math.round(days));
  const breakdown: DayBreakdown[] = [];
  let total = 0;
  for (let day = 1; day <= safeDays; day++) {
    const discountPercent = getDayDiscount(day, discounts);
    const dayPrice = pricePerDay * (1 - discountPercent / 100);
    breakdown.push({ day, pricePerDay: dayPrice, discountPercent });
    total += dayPrice;
  }
  return { total, breakdown };
};

const NBSP = '\u00a0';

/**
 * Format a ruble price with non-breaking spaces every three digits.
 *   formatRubPrice(250000)        → "250 000 ₽"  (separators are NBSPs)
 *   formatRubPrice(1200000, true) → "от 1 200 000 ₽"
 */
export const formatRubPrice = (value: number, withFromPrefix = false): string => {
  const safe = Math.max(0, Math.round(safeNumber(value)));
  const parts = safe.toString().split('').reverse();
  const grouped: string[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    if (i > 0 && i % 3 === 0) grouped.push(NBSP);
    grouped.push(parts[i]);
  }
  const formatted = grouped.reverse().join('');
  const tail = `${formatted}${NBSP}₽`;
  return withFromPrefix ? `от${NBSP}${tail}` : tail;
};
