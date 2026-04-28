import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BackgroundAsset, Scene, ScreenElement } from '../../lib/visualLed';
import { createInitialState } from './state/initialState';
import { getUploadStatus, saveProject, serializeProjectState } from './saveProject';
import type { VisualLedState } from './state/types';

function buildState(): VisualLedState {
  const base = createInitialState();
  const bgUploading: BackgroundAsset = {
    id: 'bg-up',
    name: 'uploading',
    src: 'data:image/png;base64,aaa',
    width: 100,
    height: 80,
    uploadStatus: 'uploading',
  };
  const bgFailed: BackgroundAsset = {
    id: 'bg-fail',
    name: 'failed',
    src: 'data:image/png;base64,bbb',
    width: 120,
    height: 90,
    uploadStatus: 'failed',
  };
  const bgUploaded: BackgroundAsset = {
    id: 'bg-ok',
    name: 'uploaded',
    src: 'https://signed.local/bg.jpg',
    width: 500,
    height: 300,
    uploadStatus: 'uploaded',
    storagePath: 'visual-led/backgrounds/bg-ok.jpg',
    storageBucket: 'assets',
  };
  const screen: ScreenElement = {
    id: 'screen-1',
    name: 'Main',
    corners: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ],
    videoId: null,
    cabinetPlan: null,
  };
  const scene: Scene = {
    ...base.scenes[0],
    backgrounds: [bgUploading, bgFailed, bgUploaded],
    elements: [screen],
  };
  return { ...base, scenes: [scene] };
}

describe('saveProject helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serializes project and drops background src data', () => {
    const serialized = serializeProjectState(buildState()) as {
      schemaVersion: number;
      origin: string;
      scenes: Array<{ backgrounds: Array<Record<string, unknown>> }>;
    };

    expect(serialized.schemaVersion).toBe(2);
    expect(serialized.origin).toBe('react-v2');

    const bg = serialized.scenes[0].backgrounds[2];
    expect(bg.storagePath).toBe('visual-led/backgrounds/bg-ok.jpg');
    expect(bg.storageBucket).toBe('assets');
    // Non-data URLs (signed/preset) are kept; data URLs are dropped
    expect(bg.src).toBe('https://signed.local/bg.jpg');

    const dataBg = serialized.scenes[0].backgrounds[0];
    expect(dataBg).not.toHaveProperty('src');
  });

  it('counts pending and failed uploads', () => {
    const status = getUploadStatus(buildState());
    expect(status).toEqual({ pending: 1, failed: 1 });
  });
});

describe('saveProject', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns share url on successful save', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'abc 123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await saveProject(buildState());

    expect(result.ok).toBe(true);
    expect(result.id).toBe('abc 123');
    expect(result.shareUrl).toContain('/visual-led?project=abc%20123');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/visual-led/save',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('surfaces API error body on non-413/429 responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'server failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await saveProject(buildState());
    expect(result).toEqual({ ok: false, error: 'server failed' });
  });

  it('maps 413 and 429 to friendly messages', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 413 }))
      .mockResolvedValueOnce(new Response('', { status: 429 }));

    const tooLarge = await saveProject(buildState());
    const tooMany = await saveProject(buildState());

    expect(tooLarge.ok).toBe(false);
    expect(tooLarge.error).toBeTruthy();
    expect(tooLarge.error).not.toBe('HTTP 413');

    expect(tooMany.ok).toBe(false);
    expect(tooMany.error).toBeTruthy();
    expect(tooMany.error).not.toBe('HTTP 429');
  });

  it('returns network error message when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

    const result = await saveProject(buildState());
    expect(result).toEqual({ ok: false, error: 'network down' });
  });
});

