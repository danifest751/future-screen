/**
 * Core types for the Visual LED planner. Shared between the vanilla
 * visualizer and the upcoming React rewrite. Keeping them in one place
 * so the migration can proceed without duplicating the shape.
 */

export interface Point {
  x: number;
  y: number;
}

/** Four-corner polygon for a screen (ordered TL, TR, BR, BL after `orderQuadPoints`). */
export type Quad = [Point, Point, Point, Point];

export interface ViewTransform {
  scale: number;
  minScale: number;
  maxScale: number;
  offsetX: number;
  offsetY: number;
}

export interface ScaleCalibration {
  /** Known real-world length between the two reference points, metres. */
  realLength: number;
  /** Pixel distance between the two reference points. */
  pxLength: number;
  /** Derived pixels-per-metre ratio. */
  pxPerMeter: number;
}

export interface CabinetPlan {
  /** Columns × rows grid of 0.5m × 0.5m cabinets. */
  cols: number;
  rows: number;
  /** Physical cabinet side length, metres. */
  cabinetSide: number;
  /** Pixel pitch key ("2.6", "1.9"). Used to derive resolution. */
  pitch: string;
}

export interface ScreenElement {
  id: string;
  name: string;
  corners: Quad;
  videoId: string | null;
  cabinetPlan: CabinetPlan | null;
}

export interface AssistProposal {
  corners: Quad;
  confidence: number;
  /** ROI used for the analysis (canvas-space rectangle). */
  roi: { x: number; y: number; width: number; height: number };
  /** Optional debug overlay data — guide lines etc. */
  debug?: {
    samples?: number;
    dominantAngles?: number[];
  };
}

export interface BackgroundAsset {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
}

export interface VideoAsset {
  id: string;
  name: string;
  src: string;
  duration?: number;
}

export interface Scene {
  id: string;
  name: string;
  backgrounds: BackgroundAsset[];
  activeBackgroundId: string | null;
  elements: ScreenElement[];
  selectedElementId: string | null;
  scaleCalib: ScaleCalibration | null;
  assist: AssistProposal | null;
  view: ViewTransform;
  canvasWidth: number;
  canvasHeight: number;
}

/** Pixel pitch → pixels-per-cabinet-side lookup. */
export const PIXELS_PER_CABINET: Record<string, number> = {
  '2.6': 192,
  '1.9': 256,
};

/** Default 0.5m × 0.5m cabinet side — physical standard for the fleet. */
export const CABINET_SIDE_M = 0.5;
