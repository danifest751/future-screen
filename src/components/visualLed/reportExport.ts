import { buildReportHtml, buildSceneReport, type Scene } from '../../lib/visualLed';
import { renderScene } from './canvasRenderer';
import { loadImage } from './imageLoader';

export type ExportScope = 'active' | 'all';

/**
 * Capture the currently-rendered canvas as a JPEG data URL. Only
 * captures what's on screen right now — so "all scenes" export uses
 * an offscreen render pipeline instead (see `renderSceneOffscreen`).
 */
function captureCanvasSnapshot(): string | null {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-vled-canvas]');
  if (!canvas) return null;
  try {
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return null;
  }
}

/**
 * Render a single scene into an offscreen canvas (identity view, no
 * overlays) and return a JPEG data URL. Background images are loaded
 * on demand — for data:URLs this is near-instant.
 */
async function renderSceneOffscreen(scene: Scene): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = scene.canvasWidth;
  canvas.height = scene.canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cache = new Map<string, HTMLImageElement>();
  const activeBg = scene.backgrounds.find((b) => b.id === scene.activeBackgroundId);
  if (activeBg) {
    try {
      const img = await loadImage(activeBg.src);
      cache.set(activeBg.src, img);
    } catch {
      // renderer gracefully handles a missing cache entry
    }
  }

  renderScene(
    ctx,
    { ...scene, view: { ...scene.view, scale: 1, offsetX: 0, offsetY: 0 } },
    null,
    cache,
    { showCabinetGrid: false, showAssistGuides: false },
  );
  try {
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return '';
  }
}

/**
 * Build the full HTML report — `active` reuses the already-rendered
 * canvas, `all` does a per-scene offscreen render pass.
 */
export async function buildReport(
  scenes: Scene[],
  activeSceneId: string,
  scope: ExportScope,
): Promise<string> {
  const target = scope === 'active'
    ? scenes.filter((s) => s.id === activeSceneId)
    : scenes;

  const sceneReports = await Promise.all(
    target.map(async (scene) => {
      if (scope === 'active' && scene.id === activeSceneId) {
        const snapshot = captureCanvasSnapshot() ?? '';
        return buildSceneReport(scene, snapshot);
      }
      const snapshot = await renderSceneOffscreen(scene);
      return buildSceneReport(scene, snapshot);
    }),
  );

  return buildReportHtml(sceneReports, new Date().toLocaleString());
}

export function downloadReport(html: string, filenameSuffix: string): void {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fs-report_${stamp}_${filenameSuffix}.html`;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openReportWindow(html: string): void {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

/** Unified entry point — scope-aware, async (needs offscreen render for "all"). */
export async function runReportExport(
  scenes: Scene[],
  activeSceneId: string,
  scope: ExportScope,
  action: 'download' | 'open',
): Promise<void> {
  const html = await buildReport(scenes, activeSceneId, scope);
  if (action === 'download') downloadReport(html, scope);
  else openReportWindow(html);
}
