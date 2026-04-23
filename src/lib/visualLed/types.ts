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

export type AssistConfidence = 'high' | 'medium' | 'low';
export type AssistSource = 'edge-snap' | 'dominant-angles' | 'fallback';

export interface AssistProposal {
  corners: Quad;
  confidence: AssistConfidence;
  /** 0..1 — raw score used to derive `confidence`. */
  score: number;
  /** Short human-readable reason for the proposal / its rating. */
  reason: string;
  /** Which analysis path produced the quad. */
  source: AssistSource;
  /** Canvas-space ROI that was sampled. */
  roi: { x: number; y: number; width: number; height: number };
  /** Lines used as edge hints — already translated into canvas space. */
  guides: Array<{ nx: number; ny: number; d: number }>;
  /** Screen the proposal targets (for in-place updates). */
  targetElementId: string;
  analyzedAt: number;
}

export interface BackgroundAsset {
  id: string;
  name: string;
  /** Local data URL (during upload) or signed URL (after project load). */
  src: string;
  width: number;
  height: number;
  /** Supabase storage path + bucket; present after successful upload. */
  storagePath?: string;
  storageBucket?: string;
  /** Upload lifecycle — drives UI spinners and save-gating. */
  uploadStatus?: 'idle' | 'uploading' | 'uploaded' | 'failed';
  uploadError?: string | null;
}

export interface VideoAsset {
  id: string;
  name: string;
  /** Video source — data URL, blob URL, or signed URL. Empty for procedural demos. */
  src: string;
  duration?: number;
  /**
   * If set, the asset is a procedural canvas animation (equalizer etc.)
   * rendered on an offscreen canvas in the VideoPool. These loop
   * perfectly — no WebM seam stutter from <video loop>.
   */
  animationKind?:
    | 'equalizer'
    | 'spectrum'
    | 'ripple'
    | 'pulse'
    | 'matrix'
    | null;
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
