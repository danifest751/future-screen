import type { VisualLedState } from './state/types';

/**
 * Serialise the in-memory state into the JSON payload accepted by
 * /api/visual-led/save. Backgrounds keep their storagePath + bucket
 * (uploaded to Supabase Storage at import-time); data URLs are dropped
 * to stay under the 512 KB payload cap. On load, /api/visual-led/load
 * resolves storagePath → a signed URL and hydrates bg.src.
 */
export function serializeProjectState(state: VisualLedState): Record<string, unknown> {
  return {
    schemaVersion: 2,
    origin: 'react-v2',
    scenes: state.scenes.map((scene) => ({
      id: scene.id,
      name: scene.name,
      backgrounds: scene.backgrounds.map((bg) => ({
        id: bg.id,
        name: bg.name,
        width: bg.width,
        height: bg.height,
        storagePath: bg.storagePath ?? null,
        storageBucket: bg.storageBucket ?? null,
        // `src` (data URL) intentionally dropped.
      })),
      activeBackgroundId: scene.activeBackgroundId,
      elements: scene.elements,
      selectedElementId: scene.selectedElementId,
      scaleCalib: scene.scaleCalib,
      view: scene.view,
      canvasWidth: scene.canvasWidth,
      canvasHeight: scene.canvasHeight,
    })),
    activeSceneId: state.activeSceneId,
    ui: state.ui,
  };
}

/**
 * Count backgrounds that still need to finish uploading before save is
 * truly safe. Returns { pending, failed } — caller shows a spinner or
 * warning based on these.
 */
export function getUploadStatus(state: VisualLedState): {
  pending: number;
  failed: number;
} {
  let pending = 0;
  let failed = 0;
  for (const scene of state.scenes) {
    for (const bg of scene.backgrounds) {
      if (bg.uploadStatus === 'uploading') pending += 1;
      else if (bg.uploadStatus === 'failed') failed += 1;
    }
  }
  return { pending, failed };
}

export interface SaveProjectResult {
  ok: boolean;
  id?: string;
  shareUrl?: string;
  error?: string;
}

export async function saveProject(state: VisualLedState): Promise<SaveProjectResult> {
  try {
    const response = await fetch('/api/visual-led/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: serializeProjectState(state) }),
    });
    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      if (response.status === 413) {
        message = 'Проект слишком большой. Уменьши количество сцен или экранов.';
      } else if (response.status === 429) {
        message = 'Слишком много сохранений подряд. Подожди минуту.';
      } else {
        try {
          const detail = await response.json();
          if (detail?.error) message = detail.error;
        } catch {
          // ignore
        }
      }
      return { ok: false, error: message };
    }
    const data = await response.json();
    const shareUrl = `${window.location.origin}/visual-led/v2?project=${encodeURIComponent(data.id)}`;
    return { ok: true, id: data.id, shareUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Сеть недоступна' };
  }
}
