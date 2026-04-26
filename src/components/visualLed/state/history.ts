import type { Action, VisualLedState } from './types';

/**
 * Standard past/present/future triple for a time-travel reducer.
 */
export interface HistoryState<S> {
  past: S[];
  present: S;
  future: S[];
}

/** Meta-actions the history wrapper responds to. */
export type HistoryAction =
  | { type: 'history/undo' }
  | { type: 'history/redo' }
  | { type: 'history/reset' };

/** Actions that should not create individual history snapshots. */
const SKIP_HISTORY: ReadonlySet<string> = new Set([
  // Tool flow — intermediate, the final action (e.g. screen/add) is the
  // real checkpoint.
  'tool/pushPoint',
  'tool/cancel',
  // Drag internals — `drag/begin` captures the pre-drag snapshot; every
  // subsequent screen/updateCorners + drag/end is rolled up with it.
  'drag/end',
  'screen/updateCorners',
  // View transforms — too noisy for undo, zoom/pan is ergonomic only.
  'view/set',
  'view/reset',
  // UI flag toggles aren't worth an undo entry.
  'ui/toggle',
]);

const HISTORY_MAX = 30;

/**
 * Wrap a plain `(state, action) → state` reducer with past/future
 * tracking. Intercepts `history/undo`, `history/redo`, `history/reset`.
 *
 * Special case: `drag/begin` records the PRE-drag snapshot as a
 * checkpoint so a full drag gesture is undone by a single Ctrl+Z.
 */
export function withHistory(
  reducer: (state: VisualLedState, action: Action) => VisualLedState,
) {
  return function historyReducer(
    h: HistoryState<VisualLedState>,
    action: Action | HistoryAction,
  ): HistoryState<VisualLedState> {
    if (action.type === 'history/undo') {
      if (h.past.length === 0) return h;
      const prev = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: prev,
        future: [h.present, ...h.future],
      };
    }
    if (action.type === 'history/redo') {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      return {
        past: [...h.past, h.present],
        present: next,
        future: h.future.slice(1),
      };
    }
    if (action.type === 'history/reset') {
      return { past: [], present: h.present, future: [] };
    }

    const domainAction = action as Action;

    // Drag begin — snapshot BEFORE applying, then pass through.
    if (domainAction.type === 'drag/begin') {
      const nextState = reducer(h.present, domainAction);
      if (nextState === h.present) return h;
      return {
        past: [...h.past.slice(-(HISTORY_MAX - 1)), h.present],
        present: nextState,
        future: [],
      };
    }

    const nextState = reducer(h.present, domainAction);
    if (nextState === h.present) return h;

    if (SKIP_HISTORY.has(domainAction.type)) {
      return { ...h, present: nextState };
    }

    return {
      past: [...h.past.slice(-(HISTORY_MAX - 1)), h.present],
      present: nextState,
      future: [],
    };
  };
}

export function buildInitialHistory(
  initial: VisualLedState,
): HistoryState<VisualLedState> {
  return { past: [], present: initial, future: [] };
}
