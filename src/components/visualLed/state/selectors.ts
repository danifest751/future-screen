import type { ScreenDimensions } from '../../../lib/visualLed/pricing';
import { getPreset } from '../../../lib/visualLed/presets';
import { calculateProjectEstimate } from '../../../lib/visualLed/pricing';
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
export const selectProjectEstimate = (state: VisualLedState) => {
  const screens = collectScreenDimensions(state);
  return calculateProjectEstimate(state.selectedPresetSlug, screens);
};

/** Convenience for components that need the chosen preset's metadata. */
export const selectActivePreset = (state: VisualLedState) =>
  getPreset(state.selectedPresetSlug);
