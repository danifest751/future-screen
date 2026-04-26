import type { Scene } from '../../../lib/visualLed';
import type { VisualLedState } from './types';

/** Stable id generator mirroring the legacy `uid()` helper. */
export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
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
    videos: [],
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
