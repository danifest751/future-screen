import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { Scene } from '../../../lib/visualLed';
import { createInitialState } from './initialState';
import { visualLedReducer } from './reducer';
import type { Action, VisualLedState } from './types';

interface ContextValue {
  state: VisualLedState;
  dispatch: Dispatch<Action>;
}

const VisualLedContext = createContext<ContextValue | null>(null);

export const VisualLedProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(visualLedReducer, undefined, createInitialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
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
