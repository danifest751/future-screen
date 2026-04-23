import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractProjectIdFromUrl, hydrateState, loadProject } from './loadProject';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

function minimalRawState() {
  return {
    scenes: [
      {
        id: 'scene-1',
        name: 'Scene 1',
        backgrounds: [
          {
            id: 'bg-1',
            name: 'BG',
            src: 'https://cdn.local/bg.jpg',
            width: 1920,
            height: 1080,
            storagePath: 'visual-led/backgrounds/bg-1.jpg',
            storageBucket: 'assets',
          },
        ],
        activeBackgroundId: 'bg-1',
        elements: [
          {
            id: 'screen-1',
            name: 'Screen 1',
            corners: [
              { x: 10, y: 10 },
              { x: 200, y: 10 },
              { x: 200, y: 120 },
              { x: 10, y: 120 },
            ],
            videoId: null,
            cabinetPlan: null,
          },
        ],
        selectedElementId: 'screen-1',
        scaleCalib: {
          realLength: 5,
          pxLength: 500,
          pxPerMeter: 100,
        },
        assist: null,
        view: { scale: 1.2, minScale: 0.35, maxScale: 6, offsetX: 10, offsetY: -5 },
        canvasWidth: 1280,
        canvasHeight: 720,
      },
    ],
    activeSceneId: 'scene-1',
    videos: [
      { id: 'v1', name: 'Video 1', src: 'https://cdn.local/v1.mp4', duration: 12 },
    ],
    ui: {
      showCabinetGrid: true,
      showAssistGuides: false,
      showStatsOverlay: true,
    },
  };
}

describe('extractProjectIdFromUrl', () => {
  it('returns uuid from query parameter', () => {
    expect(extractProjectIdFromUrl(`?project=${VALID_UUID}`)).toBe(VALID_UUID);
  });

  it('returns null for missing or invalid ids', () => {
    expect(extractProjectIdFromUrl('')).toBeNull();
    expect(extractProjectIdFromUrl('?project=not-a-uuid')).toBeNull();
  });
});

describe('hydrateState', () => {
  it('hydrates valid payload and marks stored backgrounds as uploaded', () => {
    const state = hydrateState(minimalRawState());
    expect(state).not.toBeNull();
    expect(state?.scenes[0].backgrounds[0].uploadStatus).toBe('uploaded');
    expect(state?.tool).toBeNull();
    expect(state?.drag).toBeNull();
  });

  it('returns null for invalid root shape', () => {
    expect(hydrateState(null)).toBeNull();
    expect(hydrateState({})).toBeNull();
    expect(hydrateState({ scenes: [] })).toBeNull();
  });

  it('falls back to first scene when activeSceneId is invalid', () => {
    const raw = minimalRawState();
    raw.activeSceneId = 'missing-scene';

    const state = hydrateState(raw);
    expect(state?.activeSceneId).toBe('scene-1');
  });

  it('drops malformed screens with invalid corner structure', () => {
    const raw = minimalRawState();
    (raw.scenes[0] as { elements: unknown[] }).elements = [
      { id: 'bad', name: 'Bad', corners: [{ x: 1, y: 2 }] },
    ];

    const state = hydrateState(raw);
    expect(state?.scenes[0].elements).toHaveLength(0);
  });
});

describe('loadProject', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns hydrated state on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ state: minimalRawState() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await loadProject(VALID_UUID);
    expect(result.ok).toBe(true);
    expect(result.state?.scenes).toHaveLength(1);
    expect(result.state?.videos).toHaveLength(1);
  });

  it('returns error when payload has unexpected state shape', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ state: { nope: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await loadProject(VALID_UUID);
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('surfaces api error detail for non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await loadProject(VALID_UUID);
    expect(result).toEqual({ ok: false, error: 'not found' });
  });

  it('returns network error when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    const result = await loadProject(VALID_UUID);
    expect(result).toEqual({ ok: false, error: 'offline' });
  });
});
