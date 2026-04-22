import type { VisualLedState } from './state/types';

/**
 * Serialise the in-memory state into the JSON payload accepted by
 * /api/visual-led/save. Backgrounds' data URLs are dropped because the
 * save endpoint has a 512 KB payload cap — for MVP we preserve only
 * metadata + layout; the user re-uploads the background when opening
 * the shared link. A proper "upload to storage, save ref" flow comes
 * in phase 5 polish.
 */
export function serializeProjectState(state: VisualLedState): Record<string, unknown> {
  return {
    schemaVersion: 2, // bump to differentiate the React rewrite payloads from legacy
    origin: 'react-v2',
    scenes: state.scenes.map((scene) => ({
      id: scene.id,
      name: scene.name,
      backgrounds: scene.backgrounds.map((bg) => ({
        id: bg.id,
        name: bg.name,
        width: bg.width,
        height: bg.height,
        // `src` intentionally dropped to stay under the payload cap.
      })),
      activeBackgroundId: scene.activeBackgroundId,
      elements: scene.elements,
      selectedElementId: scene.selectedElementId,
      scaleCalib: scene.scaleCalib,
      view: scene.view,
      canvasWidth: scene.canvasWidth,
      canvasHeight: scene.canvasHeight,
      // assist dropped — ephemeral
    })),
    activeSceneId: state.activeSceneId,
    ui: state.ui,
  };
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
