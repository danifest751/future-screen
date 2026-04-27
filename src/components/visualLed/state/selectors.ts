import type { ScreenDimensions } from '../../../lib/visualLed/pricing';
import { getPreset, VISUAL_LED_PRESETS, type VisualLedPreset } from '../../../lib/visualLed/presets';
import { calculateProjectEstimate } from '../../../lib/visualLed/pricing';
import {
  getCabinetResourceStats,
  getCabinetStats,
  getElementSizeMeters,
  type Scene,
} from '../../../lib/visualLed';
import type { VisualLedState } from './types';

/**
 * Onboarding selector — true when the visualizer should show PresetPicker
 * instead of the full editing shell.
 *
 * We INTENTIONALLY don't store this as a stored mode (would have to be
 * synced with reality and would race). Derived from:
 *   - presence of a `?project=<id>` URL → always editing (share-link),
 *   - presence of a chosen preset → editing (user already onboarded),
 *   - presence of any user-placed screens or backgrounds → editing.
 */
export const isOnboardingMode = (
  state: VisualLedState,
  hasUrlProject: boolean,
): boolean => {
  if (hasUrlProject) return false;
  if (state.selectedPresetSlug) return false;
  return state.scenes.every(
    (scene) => scene.elements.length === 0 && scene.backgrounds.length === 0,
  );
};

/**
 * Project-wide LED screen dimensions (in metres) — used by the pricing
 * selector. Falls back to an empty list when scale calibration is missing,
 * which makes the estimate lean on the preset's reference area instead.
 *
 * Each ScreenElement is stored in canvas-pixel coordinates, so the only
 * meaningful "real metres" we can extract today is *if* the active scene
 * has scaleCalib. Otherwise we treat screens as zero-area for pricing
 * purposes, and the estimate falls back to preset.areaM2.
 */
export const collectScreenDimensions = (state: VisualLedState): ScreenDimensions[] => {
  const dims: ScreenDimensions[] = [];
  for (const scene of state.scenes) {
    const calib = scene.scaleCalib;
    if (!calib || calib.pxPerMeter <= 0) continue;
    for (const el of scene.elements) {
      const xs = el.corners.map((c) => c.x);
      const ys = el.corners.map((c) => c.y);
      const widthPx = Math.max(...xs) - Math.min(...xs);
      const heightPx = Math.max(...ys) - Math.min(...ys);
      const widthM = widthPx / calib.pxPerMeter;
      const heightM = heightPx / calib.pxPerMeter;
      if (widthM > 0 && heightM > 0) {
        dims.push({ widthM, heightM });
      }
    }
  }
  return dims;
};

/** Live price estimate — what `<PriceHeader>` displays. */
export const selectProjectEstimate = (
  state: VisualLedState,
  presets: readonly VisualLedPreset[] = VISUAL_LED_PRESETS,
) => {
  const screens = collectScreenDimensions(state);
  return calculateProjectEstimate(state.selectedPresetSlug, screens, presets);
};

/** Convenience for components that need the chosen preset's metadata. */
export const selectActivePreset = (
  state: VisualLedState,
  presets: readonly VisualLedPreset[] = VISUAL_LED_PRESETS,
) => presets.find((p) => p.slug === state.selectedPresetSlug) ?? getPreset(state.selectedPresetSlug);

export interface ScreenMetric {
  id: string;
  name: string;
  selected: boolean;
  widthM: number | null;
  heightM: number | null;
  areaM2: number | null;
  cabinetCount: number | null;
  cabinetCols: number | null;
  cabinetRows: number | null;
  resolutionWidth: number | null;
  resolutionHeight: number | null;
  weightMinKg: number | null;
  weightMaxKg: number | null;
  maxPowerW: number | null;
  averagePowerW: number | null;
}

export interface SceneMetrics {
  screens: ScreenMetric[];
  selected: ScreenMetric | null;
  screenCount: number;
  totalAreaM2: number | null;
  totalCabinetCount: number | null;
  totalWeightMinKg: number | null;
  totalWeightMaxKg: number | null;
  totalMaxPowerW: number | null;
  totalAveragePowerW: number | null;
}

export const collectSceneMetrics = (scene: Scene): SceneMetrics => {
  let totalArea = 0;
  let hasAnyArea = false;
  let totalCabinets = 0;
  let hasAnyCabinets = false;
  let totalWeightMinKg = 0;
  let totalWeightMaxKg = 0;
  let totalMaxPowerW = 0;
  let totalAveragePowerW = 0;
  let hasAnyResources = false;

  const screens = scene.elements.map<ScreenMetric>((element) => {
    const size = getElementSizeMeters(element.corners, scene.scaleCalib);
    const stats = getCabinetStats(element.cabinetPlan, size);
    const resourceStats = getCabinetResourceStats(element.cabinetPlan);
    const planCabinetCount = element.cabinetPlan
      ? element.cabinetPlan.cols * element.cabinetPlan.rows
      : null;
    const areaM2 = size ? size.width * size.height : null;

    if (areaM2 !== null) {
      totalArea += areaM2;
      hasAnyArea = true;
    }

    if (planCabinetCount !== null) {
      totalCabinets += planCabinetCount;
      hasAnyCabinets = true;
    }

    if (resourceStats) {
      totalWeightMinKg += resourceStats.weightMinKg;
      totalWeightMaxKg += resourceStats.weightMaxKg;
      totalMaxPowerW += resourceStats.maxPowerW;
      totalAveragePowerW += resourceStats.averagePowerW;
      hasAnyResources = true;
    }

    return {
      id: element.id,
      name: element.name,
      selected: element.id === scene.selectedElementId,
      widthM: size?.width ?? null,
      heightM: size?.height ?? null,
      areaM2,
      cabinetCount: stats?.totalCount ?? planCabinetCount,
      cabinetCols: stats?.cols ?? element.cabinetPlan?.cols ?? null,
      cabinetRows: stats?.rows ?? element.cabinetPlan?.rows ?? null,
      resolutionWidth: stats?.pixelWidth ?? null,
      resolutionHeight: stats?.pixelHeight ?? null,
      weightMinKg: resourceStats?.weightMinKg ?? null,
      weightMaxKg: resourceStats?.weightMaxKg ?? null,
      maxPowerW: resourceStats?.maxPowerW ?? null,
      averagePowerW: resourceStats?.averagePowerW ?? null,
    };
  });

  return {
    screens,
    selected: screens.find((screen) => screen.selected) ?? null,
    screenCount: screens.length,
    totalAreaM2: hasAnyArea ? totalArea : null,
    totalCabinetCount: hasAnyCabinets ? totalCabinets : null,
    totalWeightMinKg: hasAnyResources ? totalWeightMinKg : null,
    totalWeightMaxKg: hasAnyResources ? totalWeightMaxKg : null,
    totalMaxPowerW: hasAnyResources ? totalMaxPowerW : null,
    totalAveragePowerW: hasAnyResources ? totalAveragePowerW : null,
  };
};
