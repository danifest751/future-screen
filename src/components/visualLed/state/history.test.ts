import { describe, expect, it } from 'vitest';
import type { Quad, ScreenElement } from '../../../lib/visualLed';
import { createInitialState } from './initialState';
import { buildInitialHistory, withHistory } from './history';
import { visualLedReducer } from './reducer';
import type { VisualLedState } from './types';

const rect = (x = 10, y = 10, w = 100, h = 60): Quad => [
  { x, y },
  { x: x + w, y },
  { x: x + w, y: y + h },
  { x, y: y + h },
];

function withOneScreen(state: VisualLedState): VisualLedState {
  const screen: ScreenElement = {
    id: 'screen-1',
    name: 'Screen 1',
    corners: rect(),
    videoId: null,
    cabinetPlan: null,
  };
  return visualLedReducer(state, { type: 'screen/add', payload: screen });
}

describe('withHistory', () => {
  it('supports undo and redo for regular domain actions', () => {
    const reducer = withHistory(visualLedReducer);
    const initial = createInitialState();
    const start = buildInitialHistory(initial);

    const afterAdd = reducer(start, { type: 'scene/add', payload: { name: 'A' } });
    expect(afterAdd.past).toHaveLength(1);
    expect(afterAdd.present.scenes).toHaveLength(2);
    expect(afterAdd.future).toHaveLength(0);

    const afterUndo = reducer(afterAdd, { type: 'history/undo' });
    expect(afterUndo.present.scenes).toHaveLength(1);
    expect(afterUndo.future).toHaveLength(1);

    const afterRedo = reducer(afterUndo, { type: 'history/redo' });
    expect(afterRedo.present.scenes).toHaveLength(2);
    expect(afterRedo.past).toHaveLength(1);
  });

  it('does not create history snapshots for skip-list actions', () => {
    const reducer = withHistory(visualLedReducer);
    const initial = buildInitialHistory(createInitialState());

    const next = reducer(initial, {
      type: 'ui/toggle',
      payload: { key: 'showAssistGuides', value: false },
    });

    expect(next.present.ui.showAssistGuides).toBe(false);
    expect(next.past).toHaveLength(0);
  });

  it('captures pre-drag snapshot once and allows one-step rollback of drag edits', () => {
    const reducer = withHistory(visualLedReducer);
    const stateWithScreen = withOneScreen(createInitialState());
    const initial = buildInitialHistory(stateWithScreen);
    const originalCorners = stateWithScreen.scenes[0].elements[0].corners;

    const afterDragBegin = reducer(initial, {
      type: 'drag/begin',
      payload: { type: 'corner', id: 'screen-1', corner: 0 },
    });
    expect(afterDragBegin.past).toHaveLength(1);

    const nextCorners = rect(50, 40, 160, 90);
    const afterCornerUpdate = reducer(afterDragBegin, {
      type: 'screen/updateCorners',
      payload: { id: 'screen-1', corners: nextCorners },
    });
    expect(afterCornerUpdate.past).toHaveLength(1);

    const afterDragEnd = reducer(afterCornerUpdate, { type: 'drag/end' });
    expect(afterDragEnd.past).toHaveLength(1);
    expect(afterDragEnd.present.scenes[0].elements[0].corners).toEqual(nextCorners);

    const afterUndo = reducer(afterDragEnd, { type: 'history/undo' });
    expect(afterUndo.present.scenes[0].elements[0].corners).toEqual(originalCorners);
    expect(afterUndo.present.drag).toBeNull();
  });

  it('resets past/future stacks without touching present state', () => {
    const reducer = withHistory(visualLedReducer);
    const initial = buildInitialHistory(createInitialState());
    const afterChange = reducer(initial, { type: 'scene/add', payload: { name: 'Scene X' } });
    const afterReset = reducer(afterChange, { type: 'history/reset' });

    expect(afterReset.past).toHaveLength(0);
    expect(afterReset.future).toHaveLength(0);
    expect(afterReset.present).toEqual(afterChange.present);
  });
});
