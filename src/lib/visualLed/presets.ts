// Visual LED sales presets — single source of truth.
//
// Phase A: presets live in code (`as const`), not in Supabase. The format
// will move into `public.visual_led_presets` table later (Phase D), once
// pricing is proven against real leads. Until then, edit-and-deploy is
// faster than building admin UI for placeholders.
//
// Pricing numbers are CALIBRATION PLACEHOLDERS until sales confirms them.
// Replace `basePrice` / `pricePerM2` / `eventMultiplier` per preset before
// the public launch. Order of magnitude is intentionally believable so
// the UI doesn't look broken in screenshots.
//
// `defaultCalibration` is derived from the AI-rendered human inside each
// hero (≈ 1.75 m tall by prompt). The pixel height of that figure is
// measured visually per generation and stored in `humanHeightPxApprox`
// (in scripts/preset-prompts.json). `pxPerMeter = humanPx / 1.75` —
// match the human you see, get a calibration that matches what the user
// perceives. Estimates are good to ~10 %; users can fine-tune via the
// scale tool. Re-measure after every regeneration.

import type { ScaleCalibration } from './types';

const HUMAN_HEIGHT_M = 1.75;
function calibrationFromHuman(humanPx: number): ScaleCalibration {
  return {
    realLength: HUMAN_HEIGHT_M,
    pxLength: humanPx,
    pxPerMeter: humanPx / HUMAN_HEIGHT_M,
  };
}

export type VisualLedPresetSlug =
  | 'compact'
  | 'corporate'
  | 'concert'
  | 'festival'
  | 'flagship';

export interface VisualLedPreset {
  slug: VisualLedPresetSlug;
  /** Russian-first; EN optional, only used if siteLocale === 'en'. */
  title: { ru: string; en?: string };
  description: { ru: string; en?: string };

  /** Reference area for the preset, in m². Used as base for pricing. */
  areaM2: number;
  /** Suggested screen dimensions in meters. Picker may scale them later. */
  widthM: number;
  heightM: number;

  /**
   * Pricing inputs. Final formula:
   *   price = roundToStep(basePrice + areaM2 * pricePerM2 * eventMultiplier, roundStep)
   * "From" suffix is always shown — this is an estimate, not an offer.
   */
  basePrice: number;
  pricePerM2: number;
  eventMultiplier: number;
  roundStep: number;

  /** Visual asset under /public/visual-led-presets/. */
  preview: string;
  /**
   * Canvas background that the user sees inside the editor. For Phase A
   * we reuse the same image as `preview` — the LED screen is then
   * rendered by canvasRenderer ON TOP of this background.
   */
  background: string;

  /** Defaults for the visualizer when this preset is applied. */
  defaultPitch: string;
  defaultCabinetSideM: number;
  /**
   * Auto-applied scale calibration so the user can draw screens with
   * real metric sizes immediately, without using the scale tool. Derived
   * from the composited badge in the hero (see comment at top of file).
   * `null` means "no auto-calibration" — the user must manually calibrate.
   */
  defaultCalibration: ScaleCalibration | null;
}

export const VISUAL_LED_PRESETS = [
  {
    slug: 'compact',
    title: {
      ru: 'Малая презентация',
      en: 'Compact presentation',
    },
    description: {
      ru: 'Камерное событие, презентация, малый зал',
      en: 'Small event, presentation, intimate venue',
    },
    areaM2: 15,
    widthM: 5,
    heightM: 3,
    basePrice: 30_000,
    pricePerM2: 1_500,
    eventMultiplier: 1.0,
    roundStep: 5_000,
    preview: '/visual-led-presets/compact-presentation.jpg',
    background: '/visual-led-presets/compact-presentation.jpg',
    defaultPitch: '2.6',
    defaultCabinetSideM: 0.5,
    defaultCalibration: calibrationFromHuman(770),
  },
  {
    slug: 'corporate',
    title: {
      ru: 'Корпоратив / форум',
      en: 'Corporate / forum',
    },
    description: {
      ru: 'Корпоратив, конференция, форум',
      en: 'Corporate event, conference, forum',
    },
    areaM2: 35,
    widthM: 7,
    heightM: 5,
    basePrice: 50_000,
    pricePerM2: 1_800,
    eventMultiplier: 1.1,
    roundStep: 5_000,
    preview: '/visual-led-presets/corporate-conference.jpg',
    background: '/visual-led-presets/corporate-conference.jpg',
    defaultPitch: '2.6',
    defaultCabinetSideM: 0.5,
    defaultCalibration: calibrationFromHuman(700),
  },
  {
    slug: 'concert',
    title: {
      ru: 'Сцена / концерт',
      en: 'Concert stage',
    },
    description: {
      ru: 'Сцена, концерт, шоу-программа',
      en: 'Stage, concert, performance',
    },
    areaM2: 60,
    widthM: 10,
    heightM: 6,
    basePrice: 80_000,
    pricePerM2: 2_200,
    eventMultiplier: 1.3,
    roundStep: 10_000,
    preview: '/visual-led-presets/concert-stage.jpg',
    background: '/visual-led-presets/concert-stage.jpg',
    defaultPitch: '3.9',
    defaultCabinetSideM: 0.5,
    defaultCalibration: calibrationFromHuman(290),
  },
  {
    slug: 'festival',
    title: {
      ru: 'Фестиваль',
      en: 'Festival',
    },
    description: {
      ru: 'Фестиваль, большая сцена, выставка',
      en: 'Festival, large stage, exhibition',
    },
    areaM2: 120,
    widthM: 15,
    heightM: 8,
    basePrice: 150_000,
    pricePerM2: 2_500,
    eventMultiplier: 1.5,
    roundStep: 10_000,
    preview: '/visual-led-presets/festival-outdoor.jpg',
    background: '/visual-led-presets/festival-outdoor.jpg',
    defaultPitch: '3.9',
    defaultCabinetSideM: 0.5,
    defaultCalibration: calibrationFromHuman(440),
  },
  {
    slug: 'flagship',
    title: {
      ru: 'Топ-проект',
      en: 'Flagship project',
    },
    description: {
      ru: 'Уличное шоу, арена, большой фестиваль',
      en: 'Outdoor show, arena, large festival',
    },
    areaM2: 200,
    widthM: 20,
    heightM: 10,
    basePrice: 250_000,
    pricePerM2: 2_800,
    eventMultiplier: 1.7,
    roundStep: 10_000,
    preview: '/visual-led-presets/flagship-arena.jpg',
    background: '/visual-led-presets/flagship-arena.jpg',
    defaultPitch: '5.9',
    defaultCabinetSideM: 0.5,
    defaultCalibration: calibrationFromHuman(610),
  },
] satisfies readonly VisualLedPreset[];

export const getPreset = (slug: string | null | undefined): VisualLedPreset | null => {
  if (!slug) return null;
  return VISUAL_LED_PRESETS.find((p) => p.slug === slug) ?? null;
};
