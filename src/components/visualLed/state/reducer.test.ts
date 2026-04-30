import { describe, expect, it } from 'vitest';
import type { BackgroundAsset, Quad, ScreenElement, VideoAsset } from '../../../lib/visualLed';
import { visualLedReducer } from './reducer';
import type { VisualLedState } from './types';

const quad: Quad = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 50 },
  { x: 0, y: 50 },
];

const makeScreen = (id: string): ScreenElement => ({
  id,
  name: `screen-${id}`,
  corners: quad,
  videoId: null,
  cabinetPlan: null,
});

const makeBackground = (id: string): BackgroundAsset => ({
  id,
  name: `bg-${id}`,
  src: `https://example.com/${id}.jpg`,
  width: 100,
  height: 50,
});

const makeVideo = (id: string): VideoAsset => ({
  id,
  name: `video-${id}`,
  src: `https://example.com/${id}.mp4`,
});

const makeState = (): VisualLedState => ({
  scenes: [
    {
      id: 'scene-1',
      name: 'scene 1',
      backgrounds: [],
      activeBackgroundId: null,
      elements: [],
      selectedElementId: null,
      selectedFloorPlanObject: null,
      scaleCalib: null,
      view: { scale: 1, minScale: 0.35, maxScale: 6, offsetX: 0, offsetY: 0 },
      canvasWidth: 1280,
      canvasHeight: 720,
      venue: null,
      floorPlanView: { scale: 50, minScale: 5, maxScale: 200, offsetX: 0, offsetY: 0 },
    },
    {
      id: 'scene-2',
      name: 'scene 2',
      backgrounds: [],
      activeBackgroundId: null,
      elements: [],
      selectedElementId: null,
      selectedFloorPlanObject: null,
      scaleCalib: null,
      view: { scale: 1.5, minScale: 0.35, maxScale: 6, offsetX: 10, offsetY: 20 },
      canvasWidth: 640,
      canvasHeight: 360,
      venue: null,
      floorPlanView: { scale: 50, minScale: 5, maxScale: 200, offsetX: 0, offsetY: 0 },
    },
  ],
  activeSceneId: 'scene-1',
  videos: [makeVideo('v1')],
  tool: null,
  drag: null,
  ui: {
    showCabinetGrid: true,
    showStatsOverlay: true,
    demosPaused: false,
    freeTransform: false,
    viewMode: 'visualizer',
  },
  selectedPresetSlug: null,
});

describe('visualLedReducer', () => {
  it('handles scene actions', () => {
    const state = makeState();

    const added = visualLedReducer(state, { type: 'scene/add', payload: { name: 'Custom scene' } });
    expect(added.scenes).toHaveLength(3);
    expect(added.scenes[2].name).toBe('Custom scene');
    expect(added.activeSceneId).toBe(added.scenes[2].id);

    const switched = visualLedReducer(added, { type: 'scene/switch', payload: { id: 'scene-2' } });
    expect(switched.activeSceneId).toBe('scene-2');

    const switchInvalid = visualLedReducer(added, { type: 'scene/switch', payload: { id: 'missing' } });
    expect(switchInvalid).toBe(added);

    const renamed = visualLedReducer(switched, { type: 'scene/rename', payload: { id: 'scene-2', name: ' Main ' } });
    expect(renamed.scenes.find((scene) => scene.id === 'scene-2')?.name).toBe('Main');

    const renameNoop = visualLedReducer(renamed, { type: 'scene/rename', payload: { id: 'scene-2', name: 'Main' } });
    expect(renameNoop).toBe(renamed);

    const removed = visualLedReducer(renamed, { type: 'scene/remove', payload: { id: 'scene-2' } });
    expect(removed.scenes.some((scene) => scene.id === 'scene-2')).toBe(false);

    const singleSceneState: VisualLedState = { ...state, scenes: [state.scenes[0]], activeSceneId: 'scene-1' };
    const protectedRemove = visualLedReducer(singleSceneState, { type: 'scene/remove', payload: { id: 'scene-1' } });
    expect(protectedRemove).toBe(singleSceneState);
  });

  it('handles background and screen actions', () => {
    const state = makeState();
    const bg = makeBackground('b1');
    const screen = makeScreen('s1');

    const withBg = visualLedReducer(state, { type: 'background/add', payload: bg });
    expect(withBg.scenes[0].backgrounds).toHaveLength(1);
    expect(withBg.scenes[0].activeBackgroundId).toBe('b1');

    const selectedBg = visualLedReducer(withBg, { type: 'background/select', payload: { id: null } });
    expect(selectedBg.scenes[0].activeBackgroundId).toBeNull();

    const updatedBg = visualLedReducer(withBg, {
      type: 'background/update',
      payload: { id: 'b1', patch: { name: 'new-name' } },
    });
    expect(updatedBg.scenes[0].backgrounds[0].name).toBe('new-name');

    const removedBg = visualLedReducer(updatedBg, { type: 'background/remove', payload: { id: 'b1' } });
    expect(removedBg.scenes[0].backgrounds).toHaveLength(0);

    const withScreen = visualLedReducer(state, { type: 'screen/add', payload: screen });
    expect(withScreen.scenes[0].elements).toHaveLength(1);
    expect(withScreen.scenes[0].selectedElementId).toBe('s1');

    const selectedScreen = visualLedReducer(withScreen, { type: 'screen/select', payload: { id: null } });
    expect(selectedScreen.scenes[0].selectedElementId).toBeNull();

    const updatedScreen = visualLedReducer(withScreen, {
      type: 'screen/update',
      payload: { id: 's1', patch: { name: 'renamed' } },
    });
    expect(updatedScreen.scenes[0].elements[0].name).toBe('renamed');

    const updatedCorners = visualLedReducer(updatedScreen, {
      type: 'screen/updateCorners',
      payload: { id: 's1', corners: quad.map((p) => ({ x: p.x + 1, y: p.y + 1 })) as Quad },
    });
    expect(updatedCorners.scenes[0].elements[0].corners[0]).toEqual({ x: 1, y: 1 });

    const withPlan = visualLedReducer(updatedCorners, {
      type: 'screen/setCabinetPlan',
      payload: { id: 's1', plan: { cols: 2, rows: 1, cabinetSide: 0.5, pitch: '2.6' } },
    });
    expect(withPlan.scenes[0].elements[0].cabinetPlan?.cols).toBe(2);

    const deletedScreen = visualLedReducer(withPlan, { type: 'screen/delete', payload: { id: 's1' } });
    expect(deletedScreen.scenes[0].elements).toHaveLength(0);
  });

  it('handles scale, tool and drag actions', () => {
    const state = makeState();

    const scaled = visualLedReducer(state, {
      type: 'scale/set',
      payload: { realLength: 2, pxLength: 100, pxPerMeter: 50 },
    });
    expect(scaled.scenes[0].scaleCalib?.pxPerMeter).toBe(50);

    const scaleCleared = visualLedReducer(scaled, { type: 'scale/clear' });
    expect(scaleCleared.scenes[0].scaleCalib).toBeNull();

    const toolStarted = visualLedReducer(scaleCleared, {
      type: 'tool/start',
      payload: { mode: 'place4', points: [] },
    });
    const toolPoint = visualLedReducer(toolStarted, { type: 'tool/pushPoint', payload: { x: 1, y: 2 } });
    expect(toolPoint.tool?.points).toHaveLength(1);

    const toolNoop = visualLedReducer(state, { type: 'tool/pushPoint', payload: { x: 0, y: 0 } });
    expect(toolNoop).toBe(state);

    const toolCancelled = visualLedReducer(toolPoint, { type: 'tool/cancel' });
    expect(toolCancelled.tool).toBeNull();

    const dragBegin = visualLedReducer(toolCancelled, { type: 'drag/begin', payload: { type: 'pan', lastClientX: 1, lastClientY: 2 } });
    expect(dragBegin.drag).toEqual({ type: 'pan', lastClientX: 1, lastClientY: 2 });

    const dragEnd = visualLedReducer(dragBegin, { type: 'drag/end' });
    expect(dragEnd.drag).toBeNull();
  });

  it('tracks selected floor-plan objects separately from screen selection', () => {
    const state = makeState();
    const withVenue = visualLedReducer(state, {
      type: 'venue/set',
      payload: {
        width: 10,
        depth: 8,
        height: 3,
        walls: [{ id: 'wall-1', x1: 0, y1: 0, x2: 10, y2: 0, thickness: 0.2 }],
        doors: [],
        windows: [],
        partitions: [],
        columns: [],
        stage: null,
      },
    });

    const withDoor = visualLedReducer(withVenue, {
      type: 'venue/door/add',
      payload: { id: 'door-1', wallId: 'wall-1', offset: 2, width: 0.9, swing: 'left', swingSide: 'inside' },
    });
    expect(withDoor.scenes[0].selectedFloorPlanObject).toEqual({ kind: 'door', id: 'door-1' });
    expect(withDoor.scenes[0].selectedElementId).toBeNull();

    const updatedDoor = visualLedReducer(withDoor, {
      type: 'venue/door/update',
      payload: { id: 'door-1', patch: { swing: 'right', swingSide: 'outside' } },
    });
    expect(updatedDoor.scenes[0].venue?.doors[0].swing).toBe('right');
    expect(updatedDoor.scenes[0].venue?.doors[0].swingSide).toBe('outside');

    const screen = makeScreen('s1');
    const withScreen = visualLedReducer(updatedDoor, { type: 'screen/add', payload: screen });
    expect(withScreen.scenes[0].selectedElementId).toBe('s1');
    expect(withScreen.scenes[0].selectedFloorPlanObject).toBeNull();
  });

  it('handles view, videos, ui toggles and project replace', () => {
    const state = makeState();

    const viewSet = visualLedReducer(state, { type: 'view/set', payload: { scale: 2, offsetX: 100 } });
    expect(viewSet.scenes[0].view.scale).toBe(2);
    expect(viewSet.scenes[0].view.offsetX).toBe(100);

    const viewReset = visualLedReducer(viewSet, { type: 'view/reset' });
    expect(viewReset.scenes[0].view.scale).toBe(1);
    expect(viewReset.scenes[0].view.offsetX).toBe(0);

    const resized = visualLedReducer(viewReset, { type: 'view/resizeCanvas', payload: { width: 1920, height: 1080 } });
    expect(resized.scenes[0].canvasWidth).toBe(1920);

    const addedVideo = visualLedReducer(state, { type: 'video/add', payload: makeVideo('v2') });
    expect(addedVideo.videos).toHaveLength(2);

    const removedVideo = visualLedReducer(addedVideo, { type: 'video/remove', payload: { id: 'v1' } });
    expect(removedVideo.videos.map((video) => video.id)).toEqual(['v2']);

    const uiToggled = visualLedReducer(state, { type: 'ui/toggle', payload: { key: 'showStatsOverlay' } });
    expect(uiToggled.ui.showStatsOverlay).toBe(false);

    const uiForced = visualLedReducer(uiToggled, {
      type: 'ui/toggle',
      payload: { key: 'showStatsOverlay', value: true },
    });
    expect(uiForced.ui.showStatsOverlay).toBe(true);

    const replaced = visualLedReducer(state, {
      type: 'project/replace',
      payload: { ...state, activeSceneId: 'scene-2' },
    });
    expect(replaced.activeSceneId).toBe('scene-2');

    const passthrough = visualLedReducer(state, { type: 'unknown' } as never);
    expect(passthrough).toBe(state);
  });

  it('preset/apply: sets selectedPresetSlug and adds active background', () => {
    const state = makeState();
    expect(state.selectedPresetSlug).toBeNull();
    expect(state.scenes[0].backgrounds).toHaveLength(0);

    const next = visualLedReducer(state, {
      type: 'preset/apply',
      payload: {
        slug: 'concert',
        backgroundUrl: '/visual-led-presets/concert-stage.jpg',
        backgroundName: 'Концерт / шоу',
      },
    });

    expect(next.selectedPresetSlug).toBe('concert');
    const scene = next.scenes.find((s) => s.id === next.activeSceneId)!;
    expect(scene.backgrounds).toHaveLength(1);
    expect(scene.activeBackgroundId).toBe(scene.backgrounds[0].id);
    expect(scene.backgrounds[0].src).toBe('/visual-led-presets/concert-stage.jpg');
    expect(scene.backgrounds[0].name).toBe('Концерт / шоу');
    // Calibration is intentionally NOT auto-seeded — perspective makes a
    // single px/m number wrong for screens placed away from the foreground
    // depth. User calibrates manually using the in-frame 1.75 m human.
    expect(scene.scaleCalib).toBeNull();
    // But canvas MUST be resized to the hero's natural pixel size so any
    // future manual calibration and screen-quad coordinates share one
    // coord system regardless of zoom/CSS scaling.
    expect(scene.canvasWidth).toBe(2752);
    expect(scene.canvasHeight).toBe(1536);
  });

  it('preset/apply: clears an existing user calibration so scale is redone', () => {
    const state = makeState();
    const manualCalib = { realLength: 3, pxLength: 200, pxPerMeter: 200 / 3 };
    const calibrated = visualLedReducer(state, {
      type: 'scale/set',
      payload: manualCalib,
    });
    const next = visualLedReducer(calibrated, {
      type: 'preset/apply',
      payload: {
        slug: 'concert',
        backgroundUrl: '/visual-led-presets/concert-stage.jpg',
        backgroundName: 'Концерт',
      },
    });
    const scene = next.scenes.find((s) => s.id === next.activeSceneId)!;
    expect(scene.scaleCalib).toBeNull();
  });

  it('preset/apply: leaves scaleCalib null for "Свой вариант" (no background)', () => {
    const next = visualLedReducer(makeState(), {
      type: 'preset/apply',
      payload: { slug: '__custom__', backgroundUrl: '', backgroundName: '' },
    });
    const scene = next.scenes.find((s) => s.id === next.activeSceneId)!;
    expect(scene.scaleCalib).toBeNull();
    expect(scene.backgrounds).toHaveLength(0);
  });

  it('preset/clear: drops the slug but keeps backgrounds', () => {
    const withPreset = visualLedReducer(makeState(), {
      type: 'preset/apply',
      payload: {
        slug: 'concert',
        backgroundUrl: '/visual-led-presets/concert-stage.jpg',
        backgroundName: 'Концерт',
      },
    });
    const cleared = visualLedReducer(withPreset, { type: 'preset/clear' });
    expect(cleared.selectedPresetSlug).toBeNull();
    // Backgrounds stay — clearing the preset choice doesn't undo what the
    // user already placed; they can keep editing on the same canvas.
    const scene = cleared.scenes.find((s) => s.id === cleared.activeSceneId)!;
    expect(scene.backgrounds).toHaveLength(1);
  });

  it('project/replace: hydrates legacy payloads without selectedPresetSlug', () => {
    const state = makeState();
    const legacyPayload = { ...state } as VisualLedState;
    // Simulate an old project that lacks the new field on disk.
    delete (legacyPayload as { selectedPresetSlug?: unknown }).selectedPresetSlug;

    const next = visualLedReducer(state, {
      type: 'project/replace',
      payload: legacyPayload,
    });
    expect(next.selectedPresetSlug).toBeNull();
  });
});
