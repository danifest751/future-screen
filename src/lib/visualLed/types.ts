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
    | 'aurora'
    | 'tunnel'
    | 'particles'
    | 'kaleidoscope'
    | 'radar'
    | null;
}

// ───────── Venue / Floor plan types ─────────

export interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness?: number;
}

export interface Door {
  id: string;
  wallId: string;
  offset: number;
  width: number;
  swing?: 'left' | 'right';
  swingSide?: 'inside' | 'outside';
}

export interface Window {
  id: string;
  wallId: string;
  offset: number;
  width: number;
  sillHeight?: number;
}

export interface Partition {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness?: number;
}

export interface Column {
  id: string;
  x: number;
  y: number;
  diameter: number;
}

export interface StageVenue {
  id: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  rotation: number;
}

export interface Venue {
  width: number;
  depth: number;
  height: number;
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  partitions: Partition[];
  columns: Column[];
  stage: StageVenue | null;
}

export interface ScreenPlacement {
  x: number;
  y: number;
  rotation: number;
  height: number;
  mountType: 'suspended' | 'floor';
}

export type FloorPlanObjectKind = 'wall' | 'partition' | 'door' | 'window' | 'column' | 'stage';

export interface FloorPlanObjectSelection {
  kind: FloorPlanObjectKind;
  id: string;
}

// ───────── Core scene types (extended) ─────────

export interface ScreenElement {
  id: string;
  name: string;
  corners: Quad;
  videoId: string | null;
  cabinetPlan: CabinetPlan | null;
  placement?: ScreenPlacement;
}

export interface Scene {
  id: string;
  name: string;
  backgrounds: BackgroundAsset[];
  activeBackgroundId: string | null;
  elements: ScreenElement[];
  selectedElementId: string | null;
  selectedFloorPlanObject: FloorPlanObjectSelection | null;
  scaleCalib: ScaleCalibration | null;
  view: ViewTransform;
  canvasWidth: number;
  canvasHeight: number;
  venue: Venue | null;
  floorPlanView: ViewTransform;
}

/**
 * Pixel pitch → pixels-per-cabinet-side lookup.
 * Mutable so `useVisualLedConfig` can sync DB values at runtime.
 * Covers the four standard pitches in the product catalogue.
 */
export const PIXELS_PER_CABINET: Record<string, number> = {
  '1.9': 256,
  '2.6': 192,
  '3.9': 128,
  '5.9':  84,
};

/** Default 0.5m × 0.5m cabinet side — physical standard for the fleet. */
export const CABINET_SIDE_M = 0.5;
