import { buildReportHtml, buildSceneReport, type Scene } from '../../lib/visualLed';

export type ExportScope = 'active' | 'all';

/**
 * Capture the currently-rendered canvas as a JPEG data URL. Only
 * captures what's on screen right now — so "all scenes" export still
 * requires per-scene re-render (handled by caller).
 */
function captureCanvasSnapshot(): string | null {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-vled-canvas]');
  if (!canvas) return null;
  try {
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    // Tainted canvas (e.g. CORS-less remote background) — fall back
    // to an empty snapshot rather than throwing.
    return null;
  }
}

/**
 * Build a standalone HTML report from the currently-rendered scene.
 * Phase 4 MVP covers only `active` scope; `all` requires scene
 * switching + re-capture which is a later iteration.
 */
export function buildReportForActiveScene(scene: Scene): string {
  const snapshot = captureCanvasSnapshot() ?? '';
  const sceneReport = buildSceneReport(scene, snapshot);
  return buildReportHtml([sceneReport], new Date().toLocaleString());
}

export function downloadReport(html: string, filenameSuffix = 'active'): void {
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

/** Currently only 'active' supported from this entry point. */
export function runReportExport(scene: Scene, scope: ExportScope, action: 'download' | 'open'): void {
  if (scope !== 'active') {
    // `all` needs a scene-iteration + render pass that lives in the
    // CanvasStage; leaving a stub here until phase 4f.
    return;
  }
  const html = buildReportForActiveScene(scene);
  if (action === 'download') downloadReport(html, 'active');
  else openReportWindow(html);
}
