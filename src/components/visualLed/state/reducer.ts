import type { BackgroundAsset, Scene } from '../../../lib/visualLed';
import { getPreset } from '../../../lib/visualLed/presets';
import { createSceneData, uid } from './initialState';
import type { Action, UiFlags, VisualLedState } from './types';

/**
 * Helper — returns a new `scenes` array with the active scene replaced
 * by `mutator(scene)`. Keeps the reducer case bodies compact.
 */
function mapActiveScene(
  state: VisualLedState,
  mutator: (scene: Scene) => Scene,
): Scene[] {
  return state.scenes.map((scene) =>
    scene.id === state.activeSceneId ? mutator(scene) : scene,
  );
}

/** Generate a unique scene name: "scene N" that doesn't collide. */
function nextSceneName(existing: Scene[]): string {
  const used = new Set(existing.map((s) => s.name.toLowerCase()));
  let idx = existing.length + 1;
  while (used.has(`scene ${idx}`)) idx += 1;
  return `scene ${idx}`;
}

export function visualLedReducer(state: VisualLedState, action: Action): VisualLedState {
  switch (action.type) {
    // ----- scenes -----
    case 'scene/add': {
      const name = action.payload.name?.trim() || nextSceneName(state.scenes);
      const next = createSceneData(name);
      return {
        ...state,
        scenes: [...state.scenes, next],
        activeSceneId: next.id,
      };
    }

    case 'scene/switch': {
      if (!state.scenes.some((s) => s.id === action.payload.id)) return state;
      return { ...state, activeSceneId: action.payload.id };
    }

    case 'scene/rename': {
      const target = state.scenes.find((s) => s.id === action.payload.id);
      if (!target) return state;
      const name = action.payload.name.trim();
      if (!name || name === target.name) return state;
      return {
        ...state,
        scenes: state.scenes.map((s) =>
          s.id === action.payload.id ? { ...s, name } : s,
        ),
      };
    }

    case 'scene/remove': {
      if (state.scenes.length <= 1) return state; // keep at least one scene
      const remaining = state.scenes.filter((s) => s.id !== action.payload.id);
      const newActive =
        state.activeSceneId === action.payload.id
          ? remaining[0].id
          : state.activeSceneId;
      return { ...state, scenes: remaining, activeSceneId: newActive };
    }

    // ----- backgrounds -----
    case 'background/add': {
      return {
        ...state,
        scenes: mapActiveScene(state, (scene) => ({
          ...scene,
          backgrounds: [...scene.backgrounds, action.payload],
          activeBackgroundId: scene.activeBackgroundId ?? action.payload.id,
        })),
      };
    }

    case 'background/select': {
      return {
        ...state,
        scenes: mapActiveScene(state, (scene) => ({
          ...scene,
          activeBackgroundId: action.payload.id,
        })),
      };
    }

    case 'background/remove': {
      return {
        ...state,
        scenes: mapActiveScene(state, (scene) => ({
          ...scene,
          backgrounds: scene.backgrounds.filter((b) => b.id !== action.payload.id),
          activeBackgroundId:
            scene.activeBackgroundId === action.payload.id
              ? scene.backgrounds.find((b) => b.id !== action.payload.id)?.id ?? null
              : scene.activeBackgroundId,
        })),
      };
    }

    case 'background/update': {
      return {
        ...state,
        scenes: mapActiveScene(state, (scene) => ({
          ...scene,
          backgrounds: scene.backgrounds.map((b) =>
            b.id === action.payload.id ? { ...b, ...action.payload.patch } : b,
          ),
        })),
      };
    }

    // ----- screens -----
    case 'screen/add': {
      return {
        ...state,
        scenes: mapActiveScene(state, (scene) => ({
          ...scene,
          elements: [...scene.elements, action.payload],
          selectedElementId: action.payload.id,
        })),
      };
    }

    case 'screen/update': {
      return {
        ...state,
        scenes: mapActiveScene(state, (scene) => ({
          ...scene,
          elements: scene.elements.map((el) =>
            el.id === action.payload.id ? { ...el, ...action.payload.patch } : el,
          ),
        })),
      };
    }

    case 'screen/updateCorners': {
      return {
        ...state,
        scenes: mapActiveScene(state, (scene) => ({
          ...scene,
          elements: scene.elements.map((el) =>
            el.id === action.payload.id ? { ...el, corners: action.payload.corners } : el,
          ),
        })),
      };
    }

    case 'screen/setCabinetPlan': {
      return {
        ...state,
        scenes: mapActiveScene(state, (scene) => ({
          ...scene,
          elements: scene.elements.map((el) =>
            el.id === action.payload.id ? { ...el, cabinetPlan: action.payload.plan } : el,
          ),
        })),
      };
    }

    case 'screen/delete': {
      return {
        ...state,
        scenes: mapActiveScene(state, (scene) => ({
          ...scene,
          elements: scene.elements.filter((el) => el.id !== action.payload.id),
          selectedElementId:
            scene.selectedElementId === action.payload.id ? null : scene.selectedElementId,
        })),
      };
    }

    case 'screen/select': {
      return {
        ...state,
        scenes: mapActiveScene(state, (scene) => ({
          ...scene,
          selectedElementId: action.payload.id,
        })),
      };
    }

    // ----- scale -----
    case 'scale/set': {
      return {
        ...state,
        scenes: mapActiveScene(state, (scene) => ({ ...scene, scaleCalib: action.payload })),
      };
    }

    case 'scale/clear': {
      return {
        ...state,
        scenes: mapActiveScene(state, (scene) => ({ ...scene, scaleCalib: null })),
      };
    }

    // ----- tool -----
    case 'tool/start':
      return { ...state, tool: action.payload };
    case 'tool/pushPoint': {
      if (!state.tool) return state;
      return {
        ...state,
        tool: { ...state.tool, points: [...state.tool.points, action.payload] },
      };
    }
    case 'tool/cancel':
      return { ...state, tool: null };

    // ----- drag -----
    case 'drag/begin':
      return { ...state, drag: action.payload };
    case 'drag/end':
      return { ...state, drag: null };

    // ----- view -----
    case 'view/set': {
      return {
        ...state,
        scenes: mapActiveScene(state, (scene) => ({
          ...scene,
          view: { ...scene.view, ...action.payload },
        })),
      };
    }
    case 'view/reset': {
      return {
        ...state,
        scenes: mapActiveScene(state, (scene) => ({
          ...scene,
          view: { ...scene.view, scale: 1, offsetX: 0, offsetY: 0 },
        })),
      };
    }
    case 'view/resizeCanvas': {
      return {
        ...state,
        scenes: mapActiveScene(state, (scene) => ({
          ...scene,
          canvasWidth: action.payload.width,
          canvasHeight: action.payload.height,
        })),
      };
    }

    // ----- videos -----
    case 'video/add':
      return { ...state, videos: [...state.videos, action.payload] };
    case 'video/remove':
      return {
        ...state,
        videos: state.videos.filter((v) => v.id !== action.payload.id),
      };

    // ----- ui flags -----
    case 'ui/toggle': {
      const key = action.payload.key as keyof UiFlags;
      const next = action.payload.value ?? !state.ui[key];
      return { ...state, ui: { ...state.ui, [key]: next } };
    }

    // ----- full-state replace (project load) -----
    case 'project/replace':
      // Project files saved before selectedPresetSlug existed lack the
      // field; default to null so the loaded state stays type-safe.
      return {
        ...action.payload,
        selectedPresetSlug: action.payload.selectedPresetSlug ?? null,
      };

    // ----- sales-configurator preset apply -----
    case 'preset/apply': {
      // Empty backgroundUrl = the user picked "Свой вариант" — only the
      // slug needs to update so the onboarding gate flips. No background
      // is injected; the canvas stays blank for them to build from scratch.
      if (!action.payload.backgroundUrl.trim()) {
        return { ...state, selectedPresetSlug: action.payload.slug };
      }
      const bg: BackgroundAsset = {
        id: uid('bg'),
        name: action.payload.backgroundName,
        src: action.payload.backgroundUrl,
        // Hero images are 16:9; precise width/height are recomputed from
        // the actual <img> on first paint, so these are just safe defaults.
        width: 1920,
        height: 1080,
        uploadStatus: 'uploaded',
      };
      // Auto-seed scaleCalib from the preset's known badge geometry so the
      // user can drop screens in real metric sizes without touching the
      // scale tool. We only override when the scene is uncalibrated —
      // otherwise the user's manual calibration wins (preset switch
      // shouldn't silently re-scale their work).
      const preset = getPreset(action.payload.slug);
      return {
        ...state,
        selectedPresetSlug: action.payload.slug,
        scenes: mapActiveScene(state, (scene) => ({
          ...scene,
          backgrounds: [...scene.backgrounds, bg],
          activeBackgroundId: bg.id,
          scaleCalib:
            scene.scaleCalib ?? preset?.defaultCalibration ?? null,
        })),
      };
    }

    case 'preset/clear':
      return { ...state, selectedPresetSlug: null };

    default:
      return state;
  }
}
