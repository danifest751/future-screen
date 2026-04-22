import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { Scene } from '../../../lib/visualLed';
import { buildInitialHistory, withHistory, type HistoryAction } from './history';
import { createInitialState } from './initialState';
import { clearPersistedState, loadPersistedState, persistState } from './persistence';
import { visualLedReducer } from './reducer';
import type { Action, VisualLedState } from './types';

interface ContextValue {
  state: VisualLedState;
  dispatch: Dispatch<Action | HistoryAction>;
  /** True when there's a past snapshot to revert to. */
  canUndo: boolean;
  /** True when there's a future snapshot to redo. */
  canRedo: boolean;
  /** Wipe localStorage snapshot — used by the Reset button in the header. */
  clearPersistence: () => void;
}

const VisualLedContext = createContext<ContextValue | null>(null);

const AUTOSAVE_DEBOUNCE_MS = 800;

const historyReducer = withHistory(visualLedReducer);

/** Initial state — prefer a localStorage snapshot if compatible. */
function buildInitial(): VisualLedState {
  const persisted = loadPersistedState();
  return persisted?.state ?? createInitialState();
}

export const VisualLedProvider = ({ children }: { children: ReactNode }) => {
  const [history, dispatch] = useReducer(historyReducer, undefined, () =>
    buildInitialHistory(buildInitial()),
  );
  const state = history.present;

  // Debounced autosave of the CURRENT state (no history, too large).
  useEffect(() => {
    const timer = window.setTimeout(() => persistState(state), AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  const clearPersistence = useCallback(() => {
    clearPersistedState();
  }, []);

  const value = useMemo<ContextValue>(
    () => ({
      state,
      dispatch,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      clearPersistence,
    }),
    [clearPersistence, history.future.length, history.past.length, state],
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
