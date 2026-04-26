import type {
  AssistProposal,
  BackgroundAsset,
  Quad,
  ScaleCalibration,
  Scene,
  ScreenElement,
  VideoAsset,
  ViewTransform,
} from '../../lib/visualLed';
import { createSceneData } from './state/initialState';
import type { UiFlags, VisualLedState } from './state/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function extractProjectIdFromUrl(search: string): string | null {
  const params = new URLSearchParams(search);
  const raw = params.get('project');
  if (!raw) return null;
  return UUID_RE.test(raw) ? raw : null;
}

export interface LoadProjectResult {
  ok: boolean;
  state?: VisualLedState;
  error?: string;
}

export async function loadProject(id: string): Promise<LoadProjectResult> {
  try {
    const response = await fetch(
      `/api/visual-led/load?id=${encodeURIComponent(id)}`,
      { method: 'GET' },
    );
    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const detail = await response.json();
        if (detail?.error) message = detail.error;
      } catch {
        // ignore
      }
      return { ok: false, error: message };
    }
    const data = await response.json();
    const state = hydrateState(data.state);
    if (!state) return { ok: false, error: 'Неожиданная структура проекта' };
    return { ok: true, state };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Сеть недоступна' };
  }
}

// ----- hydration -----

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function asBoolean(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function hydrateQuad(raw: unknown): Quad | null {
  if (!Array.isArray(raw) || raw.length !== 4) return null;
  const points = raw.map((p) => {
    if (!isRecord(p)) return null;
    const x = asNumber(p.x, NaN);
    const y = asNumber(p.y, NaN);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  });
  if (points.some((p) => p === null)) return null;
  return points as Quad;
}

function hydrateScreen(raw: unknown): ScreenElement | null {
  if (!isRecord(raw)) return null;
  const corners = hydrateQuad(raw.corners);
  if (!corners) return null;
  return {
    id: asString(raw.id, `scr_${Math.random().toString(36).slice(2, 10)}`),
    name: asString(raw.name, 'Экран'),
    corners,
    videoId: typeof raw.videoId === 'string' ? raw.videoId : null,
    cabinetPlan: isRecord(raw.cabinetPlan)
      ? {
          cols: asNumber(raw.cabinetPlan.cols, 1),
          rows: asNumber(raw.cabinetPlan.rows, 1),
          cabinetSide: asNumber(raw.cabinetPlan.cabinetSide, 0.5),
          pitch: asString(raw.cabinetPlan.pitch, '2.6'),
        }
      : null,
  };
}

function hydrateBackground(raw: unknown): BackgroundAsset | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const name = asString(raw.name, 'background');
  if (!id) return null;
  return {
    id,
    name,
    src: asString(raw.src),
    width: asNumber(raw.width, 0),
    height: asNumber(raw.height, 0),
    storagePath: typeof raw.storagePath === 'string' ? raw.storagePath : undefined,
    storageBucket: typeof raw.storageBucket === 'string' ? raw.storageBucket : undefined,
    uploadStatus: raw.storagePath ? 'uploaded' : 'idle',
  };
}

function hydrateScale(raw: unknown): ScaleCalibration | null {
  if (!isRecord(raw)) return null;
  const ppm = asNumber(raw.pxPerMeter, 0);
  if (ppm <= 0) return null;
  return {
    realLength: asNumber(raw.realLength, 1),
    pxLength: asNumber(raw.pxLength, ppm),
    pxPerMeter: ppm,
  };
}

function hydrateView(raw: unknown): ViewTransform {
  if (!isRecord(raw)) {
    return { scale: 1, minScale: 0.35, maxScale: 6, offsetX: 0, offsetY: 0 };
  }
  return {
    scale: asNumber(raw.scale, 1),
    minScale: asNumber(raw.minScale, 0.35),
    maxScale: asNumber(raw.maxScale, 6),
    offsetX: asNumber(raw.offsetX, 0),
    offsetY: asNumber(raw.offsetY, 0),
  };
}

function hydrateScene(raw: unknown): Scene {
  const seed = createSceneData();
  if (!isRecord(raw)) return seed;

  const backgrounds = Array.isArray(raw.backgrounds)
    ? (raw.backgrounds.map(hydrateBackground).filter(Boolean) as BackgroundAsset[])
    : [];
  const elements = Array.isArray(raw.elements)
    ? (raw.elements.map(hydrateScreen).filter(Boolean) as ScreenElement[])
    : [];

  return {
    id: asString(raw.id, seed.id),
    name: asString(raw.name, seed.name),
    backgrounds,
    activeBackgroundId:
      typeof raw.activeBackgroundId === 'string' ? raw.activeBackgroundId : null,
    elements,
    selectedElementId:
      typeof raw.selectedElementId === 'string' ? raw.selectedElementId : null,
    scaleCalib: hydrateScale(raw.scaleCalib),
    assist: isRecord(raw.assist) ? (raw.assist as unknown as AssistProposal) : null,
    view: hydrateView(raw.view),
    canvasWidth: asNumber(raw.canvasWidth, seed.canvasWidth),
    canvasHeight: asNumber(raw.canvasHeight, seed.canvasHeight),
  };
}

function hydrateVideo(raw: unknown): VideoAsset | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  if (!id) return null;
  return {
    id,
    name: asString(raw.name, 'video'),
    src: asString(raw.src),
    duration: typeof raw.duration === 'number' ? raw.duration : undefined,
  };
}

function hydrateUi(raw: unknown): UiFlags {
  if (!isRecord(raw)) {
    return { showCabinetGrid: true, showAssistGuides: true, showStatsOverlay: true };
  }
  return {
    showCabinetGrid: asBoolean(raw.showCabinetGrid, true),
    showAssistGuides: asBoolean(raw.showAssistGuides, true),
    showStatsOverlay: asBoolean(raw.showStatsOverlay, true),
  };
}

export function hydrateState(raw: unknown): VisualLedState | null {
  if (!isRecord(raw)) return null;
  const scenesRaw = Array.isArray(raw.scenes) ? raw.scenes : null;
  if (!scenesRaw || scenesRaw.length === 0) return null;

  const scenes = scenesRaw.map(hydrateScene);
  const activeId = typeof raw.activeSceneId === 'string' ? raw.activeSceneId : null;
  const activeSceneId =
    activeId && scenes.some((s) => s.id === activeId) ? activeId : scenes[0].id;

  const videos = Array.isArray(raw.videos)
    ? (raw.videos.map(hydrateVideo).filter(Boolean) as VideoAsset[])
    : [];

  // Backward compat: pre-presets share-link payloads don't carry
  // selectedPresetSlug. Coerce to null so downstream code stays type-safe.
  const selectedPresetSlug =
    typeof raw.selectedPresetSlug === 'string' ? raw.selectedPresetSlug : null;

  return {
    scenes,
    activeSceneId,
    videos,
    tool: null,
    drag: null,
    ui: hydrateUi(raw.ui),
    selectedPresetSlug,
  };
}
