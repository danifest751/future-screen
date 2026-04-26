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
    // Backward compat: snapshots saved before selectedPresetSlug landed
    // are missing the field — coerce to null so reducer paths that depend
    // on it (PriceHeader / onboarding selector) don't crash.
    const stored = parsed.state as VisualLedState;
    const hydrated: VisualLedState = ensureDemoVideos({
      ...stored,
      selectedPresetSlug: stored.selectedPresetSlug ?? null,
    });
    return { state: hydrated, savedAt: parsed.savedAt };
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
