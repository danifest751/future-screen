import { distance } from './geometry';
import {
  CABINET_SIDE_M,
  PIXELS_PER_CABINET,
  type CabinetPlan,
  type Quad,
  type ScaleCalibration,
} from './types';

/** How many px along one side of a 0.5m cabinet for the given pitch. */
export function getPixelsPerCabinetSide(pitch: string | undefined): number {
  return PIXELS_PER_CABINET[pitch ?? ''] ?? PIXELS_PER_CABINET['2.6'];
}

/** Normalise a pitch string — unknown values fall back to "2.6". */
export function normalizePitch(pitch: string | undefined): '2.6' | '1.9' {
  return pitch === '1.9' ? '1.9' : '2.6';
}

export interface ScreenSizeMeters {
  width: number;
  height: number;
}

/**
 * Average real-world dimensions of a screen quadrilateral based on a
 * pixel-per-metre calibration. Top/bottom and left/right edges are
 * averaged separately so non-rectangular placements still give sensible
 * metric dimensions.
 */
export function getElementSizeMeters(
  corners: Quad | null | undefined,
  scale: ScaleCalibration | null | undefined,
): ScreenSizeMeters | null {
  if (!corners || corners.length !== 4) return null;
  if (!scale || !scale.pxPerMeter) return null;
  const top = distance(corners[0], corners[1]);
  const bottom = distance(corners[3], corners[2]);
  const left = distance(corners[0], corners[3]);
  const right = distance(corners[1], corners[2]);
  return {
    width: ((top + bottom) / 2) / scale.pxPerMeter,
    height: ((left + right) / 2) / scale.pxPerMeter,
  };
}

/**
 * Derive a cabinet plan (cols × rows of 0.5m squares) that best fits the
 * given physical screen size. Rounds to nearest integer.
 */
export function autoFillCabinets(
  size: ScreenSizeMeters,
  pitch: string,
  moduleMeters = CABINET_SIDE_M,
): CabinetPlan {
  return {
    cols: Math.max(1, Math.round(size.width / moduleMeters)),
    rows: Math.max(1, Math.round(size.height / moduleMeters)),
    cabinetSide: moduleMeters,
    pitch: normalizePitch(pitch),
  };
}

/** Return a new plan with the columns delta applied (clamped ≥ 1). */
export function tweakCols(plan: CabinetPlan, delta: number): CabinetPlan {
  return { ...plan, cols: Math.max(1, plan.cols + delta) };
}

export function tweakRows(plan: CabinetPlan, delta: number): CabinetPlan {
  return { ...plan, rows: Math.max(1, plan.rows + delta) };
}

export interface CabinetStats {
  size: ScreenSizeMeters;
  moduleMeters: number;
  cols: number;
  rows: number;
  usedWidth: number;
  usedHeight: number;
  moduleArea: number;
  totalCount: number;
  inBoundsCount: number;
  overflowCount: number;
  overflowWidth: number;
  overflowHeight: number;
  pixelWidth: number;
  pixelHeight: number;
}

/** Tolerance for cabinets slightly exceeding the metric screen area, metres. */
export const CABINET_FIT_TOLERANCE_M = 0.015;

/**
 * Combine plan + physical size → full statistics including overflow
 * (cabinets that don't fit in the declared screen area).
 */
export function getCabinetStats(
  plan: CabinetPlan | null | undefined,
  size: ScreenSizeMeters | null | undefined,
): CabinetStats | null {
  if (!plan || !size) return null;
  const moduleMeters = plan.cabinetSide;
  const { cols, rows } = plan;
  const usedWidth = cols * moduleMeters;
  const usedHeight = rows * moduleMeters;
  const moduleArea = moduleMeters * moduleMeters;
  const totalCount = cols * rows;
  const fitCols = Math.max(
    0,
    Math.floor((size.width + CABINET_FIT_TOLERANCE_M) / moduleMeters),
  );
  const fitRows = Math.max(
    0,
    Math.floor((size.height + CABINET_FIT_TOLERANCE_M) / moduleMeters),
  );
  const inBoundsCount = Math.min(cols, fitCols) * Math.min(rows, fitRows);
  const pxPerCab = getPixelsPerCabinetSide(plan.pitch);
  return {
    size,
    moduleMeters,
    cols,
    rows,
    usedWidth,
    usedHeight,
    moduleArea,
    totalCount,
    inBoundsCount,
    overflowCount: Math.max(0, totalCount - inBoundsCount),
    overflowWidth: Math.max(0, usedWidth - size.width),
    overflowHeight: Math.max(0, usedHeight - size.height),
    pixelWidth: cols * pxPerCab,
    pixelHeight: rows * pxPerCab,
  };
}

/**
 * "Fit screen to cabinets" — compute the target physical dimensions that
 * exactly match the current cabinet plan. The caller then rescales the
 * quad to these dimensions (see `scaleQuadToMetric`).
 */
export function cabinetsToTargetSize(plan: CabinetPlan): ScreenSizeMeters {
  return {
    width: plan.cols * plan.cabinetSide,
    height: plan.rows * plan.cabinetSide,
  };
}
