import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { Scene } from '../../../lib/visualLed';
import { createInitialState } from './initialState';
import { clearPersistedState, loadPersistedState, persistState } from './persistence';
import { visualLedReducer } from './reducer';
import type { Action, VisualLedState } from './types';

interface ContextValue {
  state: VisualLedState;
  dispatch: Dispatch<Action>;
  /** Wipe localStorage snapshot — used by the Reset button in the header. */
  clearPersistence: () => void;
}

const VisualLedContext = createContext<ContextValue | null>(null);

const AUTOSAVE_DEBOUNCE_MS = 800;

/**
 * Build the initial state, preferring a localStorage snapshot if it's
 * present and schema-compatible. Runs once on provider mount.
 */
function buildInitial(): VisualLedState {
  const persisted = loadPersistedState();
  return persisted?.state ?? createInitialState();
}

export const VisualLedProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(visualLedReducer, undefined, buildInitial);

  // Debounced autosave: persist whenever state settles for
  // AUTOSAVE_DEBOUNCE_MS without further changes.
  useEffect(() => {
    const timer = window.setTimeout(() => persistState(state), AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  const value = useMemo<ContextValue>(
    () => ({
      state,
      dispatch,
      clearPersistence: () => {
        clearPersistedState();
      },
    }),
    [state],
  );

  return <VisualLedContext.Provider value={value}>{children}</VisualLedContext.Provider>;
};

export function useVisualLed(): ContextValue {
  const ctx = useContext(VisualLedContext);
  if (!ctx) {
    throw new Error('useVisualLed must be used inside <VisualLedProvider>');
  }
  return ctx;
}

/** Convenience selector for the currently-active scene. */
export function useActiveScene(): Scene {
  const { state } = useVisualLed();
  const found = state.scenes.find((s) => s.id === state.activeSceneId);
  // Fallback — first scene is guaranteed to exist by createInitialState,
  // but handle the pathological case defensively so TS can narrow.
  return found ?? state.scenes[0];
}

/** Convenience selector for the selected element in the active scene. */
export function useSelectedElement() {
  const scene = useActiveScene();
  return scene.elements.find((el) => el.id === scene.selectedElementId) ?? null;
}
