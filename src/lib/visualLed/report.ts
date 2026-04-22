/**
 * Report generation — takes in-memory scene snapshots + metrics and
 * emits a standalone printable HTML document. Pure string templating,
 * no DOM. The React renderer captures the canvas snapshot (as a data:
 * URL) and passes it in `sceneSnapshots[sceneId]`.
 */

import { distance } from './geometry';
import {
  getCabinetStats,
  getElementSizeMeters,
  getPixelsPerCabinetSide,
  normalizePitch,
} from './cabinet';
import type { ScreenElement, Scene, ScaleCalibration } from './types';

export interface ScreenMetric {
  screen: string;
  source: string;
  pitch: string;
  sizeW: string;
  sizeH: string;
  area: string;
  cabCols: number | string;
  cabRows: number | string;
  cabTotal: number | string;
  cabArea: string;
  inBounds: number | string;
  overflow: number | string;
  resolution: string;
  topEdge: string;
  rightEdge: string;
  bottomEdge: string;
  leftEdge: string;
  diagMain: string;
  diagCross: string;
}

export interface SceneReport {
  id: string;
  name: string;
  snapshotImage: string;
  rows: ScreenMetric[];
}

/** Small HTML escaper matching the legacy semantics. */
export function escapeHtml(text: unknown): string {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Format a pixel distance as metres (if scale is known) or pixels. */
export function formatDistanceLabel(
  pxDistance: number,
  scale: ScaleCalibration | null | undefined,
): string {
  if (scale?.pxPerMeter) {
    return `${(pxDistance / scale.pxPerMeter).toFixed(2)} м`;
  }
  return `${pxDistance.toFixed(1)} px`;
}

export function getElementDistanceLabels(
  element: Pick<ScreenElement, 'corners'>,
  scale: ScaleCalibration | null | undefined,
) {
  const { corners } = element;
  return {
    top: formatDistanceLabel(distance(corners[0], corners[1]), scale),
    right: formatDistanceLabel(distance(corners[1], corners[2]), scale),
    bottom: formatDistanceLabel(distance(corners[2], corners[3]), scale),
    left: formatDistanceLabel(distance(corners[3], corners[0]), scale),
    diagMain: formatDistanceLabel(distance(corners[0], corners[2]), scale),
    diagCross: formatDistanceLabel(distance(corners[1], corners[3]), scale),
  };
}

/** Build the per-screen metric row shown in the report + HUD overlay. */
export function collectScreenMetric(
  element: ScreenElement & { placementSource?: string },
  idx: number,
  scale: ScaleCalibration | null | undefined,
): ScreenMetric {
  const size = getElementSizeMeters(element.corners, scale);
  const stats = getCabinetStats(element.cabinetPlan, size);
  const pitch = normalizePitch(element.cabinetPlan?.pitch);
  const pxPerCab = getPixelsPerCabinetSide(pitch);
  const distances = getElementDistanceLabels(element, scale);

  const rows = element.cabinetPlan?.rows || 0;
  const cols = element.cabinetPlan?.cols || 0;
  const totalCab = rows * cols;
  const reportResolution = totalCab ? `${cols * pxPerCab} x ${rows * pxPerCab}` : '—';

  return {
    screen: element.name || `Экран ${idx + 1}`,
    source: element.placementSource || 'manual',
    pitch: `P${pitch}`,
    sizeW: size ? size.width.toFixed(2) : '—',
    sizeH: size ? size.height.toFixed(2) : '—',
    area: size ? (size.width * size.height).toFixed(2) : '—',
    cabCols: cols || '—',
    cabRows: rows || '—',
    cabTotal: totalCab || '—',
    cabArea: totalCab ? (totalCab * 0.25).toFixed(2) : '—',
    inBounds: stats ? stats.inBoundsCount : '—',
    overflow: stats ? stats.overflowCount : '—',
    resolution: reportResolution,
    topEdge: distances.top,
    rightEdge: distances.right,
    bottomEdge: distances.bottom,
    leftEdge: distances.left,
    diagMain: distances.diagMain,
    diagCross: distances.diagCross,
  };
}

/**
 * Assemble the per-scene report block (rows + totals). Caller supplies
 * the snapshot image (data URL) since capturing the canvas lives in the
 * React component, not in this pure module.
 */
export function buildSceneReport(
  scene: Scene & { elements: ScreenElement[] },
  snapshotImage: string,
): SceneReport {
  const rows = scene.elements.map((el, i) => collectScreenMetric(el, i, scene.scaleCalib));
  return { id: scene.id, name: scene.name, snapshotImage, rows };
}

const REPORT_CSS = `
body { font-family: Segoe UI, Arial, sans-serif; margin: 20px; color: #1f2a3d; }
h1 { margin: 0 0 6px; }
h3 { margin: 0 0 10px; }
.meta { color: #5b647a; margin-bottom: 14px; }
.shot { max-width: 100%; border: 1px solid #d4ddec; border-radius: 8px; display: block; }
.summary { margin-top: 14px; padding: 10px 12px; background: #f6f9ff; border: 1px solid #d8dfec; border-radius: 8px; font-size: 13px; }
.scene-block { margin-top: 24px; }
.scene-block h2 { margin: 0 0 10px; font-size: 18px; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 10px; margin-top: 14px; }
.card { border: 1px solid #d8dfec; border-radius: 8px; padding: 10px 12px; background: #fff; }
.kv { display: grid; grid-template-columns: 190px 1fr; gap: 8px; margin: 4px 0; font-size: 13px; }
.kv span { color: #5b647a; }
`.trim();

function renderScreenCard(r: ScreenMetric, idx: number): string {
  return `<section class="card">
  <h3>${idx + 1}. ${escapeHtml(r.screen)}</h3>
  <div class="kv"><span>Источник:</span><b>${escapeHtml(r.source)}</b></div>
  <div class="kv"><span>Pixel pitch:</span><b>${escapeHtml(r.pitch)}</b></div>
  <div class="kv"><span>Размер экрана:</span><b>${escapeHtml(r.sizeW)} м x ${escapeHtml(r.sizeH)} м</b></div>
  <div class="kv"><span>Площадь экрана:</span><b>${escapeHtml(r.area)} м²</b></div>
  <div class="kv"><span>Кабинеты:</span><b>${escapeHtml(r.cabCols)} x ${escapeHtml(r.cabRows)} = ${escapeHtml(r.cabTotal)}</b></div>
  <div class="kv"><span>Площадь кабинетов:</span><b>${escapeHtml(r.cabArea)} м²</b></div>
  <div class="kv"><span>Внутри / Вне:</span><b>${escapeHtml(r.inBounds)} / ${escapeHtml(r.overflow)}</b></div>
  <div class="kv"><span>Разрешение экрана:</span><b>${escapeHtml(r.resolution)} px</b></div>
  <div class="kv"><span>Сторона AB (верх):</span><b>${escapeHtml(r.topEdge)}</b></div>
  <div class="kv"><span>Сторона BC (право):</span><b>${escapeHtml(r.rightEdge)}</b></div>
  <div class="kv"><span>Сторона CD (низ):</span><b>${escapeHtml(r.bottomEdge)}</b></div>
  <div class="kv"><span>Сторона DA (лево):</span><b>${escapeHtml(r.leftEdge)}</b></div>
  <div class="kv"><span>Диагональ AC:</span><b>${escapeHtml(r.diagMain)}</b></div>
  <div class="kv"><span>Диагональ BD:</span><b>${escapeHtml(r.diagCross)}</b></div>
</section>`;
}

function renderSceneSection(scene: SceneReport, sceneIndex: number): string {
  const sceneCards = scene.rows.length
    ? scene.rows.map((r, idx) => renderScreenCard(r, idx)).join('\n')
    : "<div class='card'>Нет данных по экранам</div>";
  const sceneCabinets = scene.rows.reduce((sum, r) => sum + (Number(r.cabTotal) || 0), 0);
  const sceneArea = scene.rows.reduce((sum, r) => sum + (Number(r.area) || 0), 0);
  return `<section class="scene-block">
  <h2>${sceneIndex + 1}. Сцена: ${escapeHtml(scene.name)}</h2>
  <img class="shot" src="${scene.snapshotImage}" alt="Scene snapshot ${sceneIndex + 1}" />
  <div class="summary">
    Экранов: <b>${scene.rows.length}</b> |
    Кабинетов всего: <b>${sceneCabinets}</b> |
    Суммарная площадь экранов: <b>${sceneArea.toFixed(2)} м²</b>
  </div>
  <div class="cards">
    ${sceneCards}
  </div>
</section>`;
}

/** Build the final printable HTML string. `date` is injected so callers can stamp it consistently. */
export function buildReportHtml(sceneReports: SceneReport[], date: string): string {
  const allRows = sceneReports.flatMap((scene) => scene.rows);
  const totalScreens = allRows.length;
  const totalCabinets = allRows.reduce((sum, r) => sum + (Number(r.cabTotal) || 0), 0);
  const totalArea = allRows.reduce((sum, r) => sum + (Number(r.area) || 0), 0);

  const sceneSections = sceneReports
    .map((scene, sceneIndex) => renderSceneSection(scene, sceneIndex))
    .join('\n');

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>FS Report</title>
  <style>${REPORT_CSS}</style>
</head>
<body>
  <h1>Отчет по сценам</h1>
  <div class="meta">Сформирован: ${escapeHtml(date)}</div>
  <div class="summary">
    Сцен: <b>${sceneReports.length}</b> |
    Экранов: <b>${totalScreens}</b> |
    Кабинетов всего: <b>${totalCabinets}</b> |
    Суммарная площадь экранов: <b>${totalArea.toFixed(2)} м²</b>
  </div>
  ${sceneSections || "<section class='scene-block'><div class='card'>Нет данных по сценам</div></section>"}
</body>
</html>`;
}
