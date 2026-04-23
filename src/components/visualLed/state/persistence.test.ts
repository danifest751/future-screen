import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScreenElement } from '../../../lib/visualLed';
import { createInitialState } from './initialState';
import { clearPersistedState, loadPersistedState, persistState } from './persistence';
import type { VisualLedState } from './types';

const STORAGE_KEY = 'vled-v2-state';
type LocalStorageMock = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

let localStorageMock: LocalStorageMock;
let storageData: Map<string, string>;

function stateWithTransientFields(): VisualLedState {
  const base = createInitialState();
  const screen: ScreenElement = {
    id: 'screen-1',
    name: 'Screen 1',
    corners: [
      { x: 10, y: 10 },
      { x: 110, y: 10 },
      { x: 110, y: 70 },
      { x: 10, y: 70 },
    ],
    videoId: null,
    cabinetPlan: null,
  };
  const firstScene = base.scenes[0];
  return {
    ...base,
    tool: { mode: 'place4', points: [{ x: 1, y: 2 }] },
    drag: { type: 'move', id: 'screen-1', lastX: 50, lastY: 20 },
    scenes: [
      {
        ...firstScene,
        elements: [screen],
        selectedElementId: screen.id,
      },
    ],
  };
}

describe('visualLed persistence', () => {
  beforeEach(() => {
    storageData = new Map<string, string>();
    localStorageMock = {
      getItem: (key) => (storageData.has(key) ? storageData.get(key) ?? null : null),
      setItem: (key, value) => {
        storageData.set(key, value);
      },
      removeItem: (key) => {
        storageData.delete(key);
      },
      clear: () => {
        storageData.clear();
      },
    };
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: localStorageMock,
    });
  });

  afterEach(() => {
    localStorageMock.clear();
    vi.restoreAllMocks();
  });

  it('persists state and strips transient tool/drag fields', () => {
    persistState(stateWithTransientFields());
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();

    const parsed = JSON.parse(raw as string) as {
      version: number;
      savedAt: number;
      state: VisualLedState;
    };
    expect(parsed.version).toBe(1);
    expect(typeof parsed.savedAt).toBe('number');
    expect(parsed.state.tool).toBeNull();
    expect(parsed.state.drag).toBeNull();
  });

  it('loads a valid persisted snapshot', () => {
    const state = stateWithTransientFields();
    persistState(state);

    const loaded = loadPersistedState();
    expect(loaded).not.toBeNull();
    expect(loaded?.state.scenes[0].elements).toHaveLength(1);
    expect(typeof loaded?.savedAt).toBe('number');
  });

  it('returns null for missing, invalid or incompatible payloads', () => {
    expect(loadPersistedState()).toBeNull();

    window.localStorage.setItem(STORAGE_KEY, '{bad json');
    expect(loadPersistedState()).toBeNull();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 99, savedAt: Date.now(), state: {} }),
    );
    expect(loadPersistedState()).toBeNull();
  });

  it('clears persisted snapshot', () => {
    persistState(createInitialState());
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy();

    clearPersistedState();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('swallows localStorage write errors', () => {
    vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => persistState(createInitialState())).not.toThrow();
  });

  it('swallows localStorage remove errors', () => {
    vi.spyOn(localStorageMock, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => clearPersistedState()).not.toThrow();
  });
});
