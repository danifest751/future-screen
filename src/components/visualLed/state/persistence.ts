import { ensureDemoVideos } from './initialState';
import type { VisualLedState } from './types';

const STORAGE_KEY = 'vled-v2-state';
const STORAGE_VERSION = 1;

interface StoredShape {
  version: number;
  savedAt: number;
  state: VisualLedState;
}

/**
 * Dump the full in-memory state into localStorage. Includes everything
 * — scenes, elements, cabinets, videos (as data-URLs), backgrounds.
 * Large projects may exceed the per-origin quota (~5 MB); that failure
 * is swallowed so the app keeps working rather than throwing.
 */
export function persistState(state: VisualLedState): void {
  try {
    const payload: StoredShape = {
      version: STORAGE_VERSION,
      savedAt: Date.now(),
      state: {
        ...state,
        // Drop the ephemeral UI bits so they don't clobber defaults on restore.
        tool: null,
        drag: null,
      },
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota exceeded / private mode — silent
  }
}

/** Retrieve the persisted state or `null` if absent / incompatible. */
export function loadPersistedState(): { state: VisualLedState; savedAt: number } | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredShape>;
    if (
      !parsed ||
      parsed.version !== STORAGE_VERSION ||
      typeof parsed.savedAt !== 'number' ||
      !parsed.state
    ) {
      return null;
    }
    // Backward compat: snapshots saved before newer ui flags landed
    // are missing them — coerce to defaults so reducer paths that
    // depend on them don't crash.
    const stored = parsed.state as VisualLedState;
    const hydrated: VisualLedState = ensureDemoVideos({
      ...stored,
      selectedPresetSlug: stored.selectedPresetSlug ?? null,
      ui: {
        ...stored.ui,
        freeTransform: stored.ui?.freeTransform ?? false,
        viewMode: stored.ui?.viewMode ?? 'visualizer',
      },
    });
    // Backward compat: scenes saved before venue/floorPlanView
    const scenesWithVenue = hydrated.scenes.map((scene) => ({
      ...scene,
      venue: scene.venue ?? null,
      selectedFloorPlanObject: scene.selectedFloorPlanObject ?? null,
      floorPlanView: scene.floorPlanView ?? {
        scale: 50,
        minScale: 5,
        maxScale: 200,
        offsetX: 0,
        offsetY: 0,
      },
    }));
    return { state: { ...hydrated, scenes: scenesWithVenue }, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

export function clearPersistedState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
