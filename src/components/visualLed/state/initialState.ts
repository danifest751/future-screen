import type { Scene, VideoAsset } from '../../../lib/visualLed';
import { DEMO_SPECS } from '../demoVideos';
import type { VisualLedState } from './types';

/** Stable id generator mirroring the legacy `uid()` helper. */
export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

/**
 * Build the canonical set of demo videos. Used by createInitialState (new
 * sessions) and by ensureDemos (legacy persisted snapshots). Each entry
 * is an animationKind canvas — no MediaRecorder, no storage cost.
 */
export function createDemoVideos(): VideoAsset[] {
  return DEMO_SPECS.map((spec) => ({
    id: uid('demo'),
    name: spec.name,
    src: '',
    animationKind: spec.kind,
  }));
}

/**
 * Make sure the user always has at least one demo video in their library
 * — the picker becomes useless without them. Triggered for fresh state
 * AND for legacy localStorage snapshots that pre-date auto-seeding.
 *
 * "Has at least one demo" is the trigger, not "library is empty" — if
 * the user uploaded their own clips, we don't want to dump 10 demos on
 * top. If they explicitly removed every demo and only kept uploads, we
 * still don't re-seed (`some` over animationKind handles both cases).
 */
export function ensureDemoVideos(state: VisualLedState): VisualLedState {
  const hasAnyDemo = state.videos.some((v) => Boolean(v.animationKind));
  const hasAnyUpload = state.videos.some((v) => !v.animationKind);
  if (hasAnyDemo || hasAnyUpload) return state;
  return { ...state, videos: createDemoVideos() };
}

export function createSceneData(name = 'default'): Scene {
  return {
    id: uid('scene'),
    name,
    backgrounds: [],
    activeBackgroundId: null,
    elements: [],
    selectedElementId: null,
    scaleCalib: null,
    assist: null,
    view: {
      scale: 1,
      minScale: 0.35,
      maxScale: 6,
      offsetX: 0,
      offsetY: 0,
    },
    canvasWidth: 1280,
    canvasHeight: 720,
  };
}

export function createInitialState(): VisualLedState {
  const firstScene = createSceneData('default');
  return {
    scenes: [firstScene],
    activeSceneId: firstScene.id,
    videos: createDemoVideos(),
    tool: null,
    drag: null,
    ui: {
      showCabinetGrid: true,
      showAssistGuides: true,
      showStatsOverlay: true,
    },
    selectedPresetSlug: null,
  };
}
