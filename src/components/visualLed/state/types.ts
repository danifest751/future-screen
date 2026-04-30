import type {
  BackgroundAsset,
  CabinetPlan,
  FloorPlanObjectSelection,
  Point,
  Quad,
  ScaleCalibration,
  Scene,
  ScreenElement,
  VideoAsset,
  ViewTransform,
} from '../../../lib/visualLed';

/**
 * Tool — the click-driven placement flow the user is currently in.
 *   `scale2`: expecting 2 points for scale calibration
 *   `place4`: expecting 4 corner points to drop a new screen
 */
export type Tool =
  | { mode: 'scale2'; points: Point[] }
  | { mode: 'place4'; points: Point[] };

/**
 * Drag — transient gesture while the user holds the mouse button down.
 * Stored in state only for duration of the drag; cleared on mouseup.
 */
export type Drag =
  | { type: 'pan'; lastClientX: number; lastClientY: number }
  | { type: 'corner'; id: string; corner: number }
  | { type: 'move'; id: string; lastX: number; lastY: number };

export interface UiFlags {
  showCabinetGrid: boolean;
  showStatsOverlay: boolean;
  /**
   * Freeze procedural demo animations on the canvas + library thumbnails.
   * Useful when the user wants to take a still snapshot or stops being
   * distracted by the constantly-moving demos while measuring.
   */
  demosPaused: boolean;
  /**
   * "Свободная трансформация". When false (default), corner handles
   * are locked — the user resizes a screen by dragging its edges, and
   * the rectangle stays a rectangle. When true, corner handles drag
   * individually, allowing perspective distortion to match a slanted
   * surface in the photo.
   */
  freeTransform: boolean;
  viewMode: 'visualizer' | 'floorPlan';
}

export interface VisualLedState {
  scenes: Scene[];
  activeSceneId: string;
  videos: VideoAsset[];
  tool: Tool | null;
  drag: Drag | null;
  ui: UiFlags;
  /**
   * Slug of the sales preset the user picked at onboarding (e.g.
   * 'concert', 'festival'). Drives the price header's multiplier and
   * the QuoteRequestModal's `extra.preset_slug`. `null` until the user
   * either picks a preset or skips onboarding via "Свой вариант".
   */
  selectedPresetSlug: string | null;
}

// ----- actions -----

export type Action =
  // Scenes
  | { type: 'scene/add'; payload: { name?: string } }
  | { type: 'scene/switch'; payload: { id: string } }
  | { type: 'scene/rename'; payload: { id: string; name: string } }
  | { type: 'scene/remove'; payload: { id: string } }

  // Backgrounds
  | { type: 'background/add'; payload: BackgroundAsset }
  | { type: 'background/select'; payload: { id: string | null } }
  | { type: 'background/remove'; payload: { id: string } }
  | {
      type: 'background/update';
      payload: { id: string; patch: Partial<BackgroundAsset> };
    }

  // Screens (elements)
  | { type: 'screen/add'; payload: ScreenElement }
  | { type: 'screen/update'; payload: { id: string; patch: Partial<ScreenElement> } }
  | { type: 'screen/updateCorners'; payload: { id: string; corners: Quad } }
  | { type: 'screen/setCabinetPlan'; payload: { id: string; plan: CabinetPlan | null } }
  | { type: 'screen/delete'; payload: { id: string } }
  | { type: 'screen/select'; payload: { id: string | null } }
  | { type: 'floorPlan/selectObject'; payload: FloorPlanObjectSelection | null }

  // Scale calibration
  | { type: 'scale/set'; payload: ScaleCalibration }
  | { type: 'scale/clear' }

  // Tool flow
  | { type: 'tool/start'; payload: Tool }
  | { type: 'tool/pushPoint'; payload: Point }
  | { type: 'tool/cancel' }

  // Drag
  | { type: 'drag/begin'; payload: Drag }
  | { type: 'drag/end' }

  // View
  | { type: 'view/set'; payload: Partial<ViewTransform> }
  | { type: 'view/reset' }
  | { type: 'view/resizeCanvas'; payload: { width: number; height: number } }

  // Videos (library scope, not scene scope)
  | { type: 'video/add'; payload: VideoAsset }
  | { type: 'video/remove'; payload: { id: string } }

  // UI flags
  | { type: 'ui/toggle'; payload: { key: keyof UiFlags; value?: boolean } }
  | { type: 'ui/setViewMode'; payload: 'visualizer' | 'floorPlan' }

  // Venue / floor plan
  | { type: 'venue/set'; payload: import('../../../lib/visualLed').Venue }
  | { type: 'venue/wall/add'; payload: import('../../../lib/visualLed').Wall }
  | { type: 'venue/wall/update'; payload: { id: string; patch: Partial<import('../../../lib/visualLed').Wall> } }
  | { type: 'venue/wall/remove'; payload: { id: string } }
  | { type: 'venue/door/add'; payload: import('../../../lib/visualLed').Door }
  | { type: 'venue/door/update'; payload: { id: string; patch: Partial<import('../../../lib/visualLed').Door> } }
  | { type: 'venue/door/remove'; payload: { id: string } }
  | { type: 'venue/window/add'; payload: import('../../../lib/visualLed').Window }
  | { type: 'venue/window/update'; payload: { id: string; patch: Partial<import('../../../lib/visualLed').Window> } }
  | { type: 'venue/window/remove'; payload: { id: string } }
  | { type: 'venue/partition/add'; payload: import('../../../lib/visualLed').Partition }
  | { type: 'venue/partition/update'; payload: { id: string; patch: Partial<import('../../../lib/visualLed').Partition> } }
  | { type: 'venue/partition/remove'; payload: { id: string } }
  | { type: 'venue/column/add'; payload: import('../../../lib/visualLed').Column }
  | { type: 'venue/column/update'; payload: { id: string; patch: Partial<import('../../../lib/visualLed').Column> } }
  | { type: 'venue/column/remove'; payload: { id: string } }
  | { type: 'venue/stage/set'; payload: import('../../../lib/visualLed').StageVenue | null }

  // Screen placement on floor plan
  | { type: 'screen/setPlacement'; payload: { id: string; placement: import('../../../lib/visualLed').ScreenPlacement | null } }
  | { type: 'screen/updatePlacement'; payload: { id: string; patch: Partial<import('../../../lib/visualLed').ScreenPlacement> } }

  // Floor plan view
  | { type: 'floorPlanView/set'; payload: Partial<ViewTransform> }
  | { type: 'floorPlanView/reset' }

  // Wholesale replace — used when hydrating a shared project from a URL.
  | { type: 'project/replace'; payload: VisualLedState }

  // Sales-configurator onboarding: applies a preset (sets selectedPresetSlug
  // and adds the preset's hero image as the active background of the
  // current scene). The user then continues in editing mode.
  | { type: 'preset/apply'; payload: { slug: string; backgroundUrl: string; backgroundName: string } }
  // Reset preset choice (used by "Свой вариант" / restart flow).
  | { type: 'preset/clear' };
