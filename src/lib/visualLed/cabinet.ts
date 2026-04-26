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

export type CabinetPitch = ReturnType<typeof normalizePitch>;

export interface CabinetResourceSpec {
  pitch: CabinetPitch;
  weightMinKg: number;
  weightMaxKg: number;
  maxPowerW: number;
  averagePowerW: number;
}

export interface CabinetResourceStats {
  resourceSpec: CabinetResourceSpec;
  weightMinKg: number;
  weightMaxKg: number;
  maxPowerW: number;
  averagePowerW: number;
}

const CABINET_RESOURCE_SPECS: Record<CabinetPitch, CabinetResourceSpec> = {
  '1.9': {
    pitch: '1.9',
    weightMinKg: 7,
    weightMaxKg: 9,
    maxPowerW: 200,
    averagePowerW: 70,
  },
  '2.6': {
    pitch: '2.6',
    weightMinKg: 6,
    weightMaxKg: 8,
    maxPowerW: 160,
    averagePowerW: 55,
  },
};

export function getCabinetResourceSpec(pitch: string | undefined): CabinetResourceSpec {
  return CABINET_RESOURCE_SPECS[normalizePitch(pitch)];
}

export function getCabinetResourceStats(
  plan: CabinetPlan | null | undefined,
): CabinetResourceStats | null {
  if (!plan) return null;
  const totalCount = plan.cols * plan.rows;
  const resourceSpec = getCabinetResourceSpec(plan.pitch);
  return {
    resourceSpec,
    weightMinKg: totalCount * resourceSpec.weightMinKg,
    weightMaxKg: totalCount * resourceSpec.weightMaxKg,
    maxPowerW: totalCount * resourceSpec.maxPowerW,
    averagePowerW: totalCount * resourceSpec.averagePowerW,
  };
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
 * given physical screen size. Conservative — uses `floor` so a partial
 * cabinet that would overflow the declared screen area is dropped (a half
 * cabinet hanging off the edge isn't physically installable). The user
 * can still bump cols/rows manually with the +/- buttons if they want.
 *
 * `+ FIT_TOLERANCE` lets a screen that's only a few mm short of the next
 * full cabinet still earn that extra column/row — covers the common case
 * where the user dragged corners by hand and is 1-2 cm off.
 */
export function autoFillCabinets(
  size: ScreenSizeMeters,
  pitch: string,
  moduleMeters = CABINET_SIDE_M,
): CabinetPlan {
  return {
    cols: Math.max(1, Math.floor((size.width + CABINET_FIT_TOLERANCE_M) / moduleMeters)),
    rows: Math.max(1, Math.floor((size.height + CABINET_FIT_TOLERANCE_M) / moduleMeters)),
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
  resourceSpec: CabinetResourceSpec;
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
  weightMinKg: number;
  weightMaxKg: number;
  maxPowerW: number;
  averagePowerW: number;
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
  const resourceStats = getCabinetResourceStats(plan)!;
  return {
    size,
    resourceSpec: resourceStats.resourceSpec,
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
    weightMinKg: resourceStats.weightMinKg,
    weightMaxKg: resourceStats.weightMaxKg,
    maxPowerW: resourceStats.maxPowerW,
    averagePowerW: resourceStats.averagePowerW,
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
