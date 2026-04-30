import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  formatDistanceLabel,
  getElementDistanceLabels,
  collectScreenMetric,
  buildReportHtml,
  buildSceneReport,
} from './report';
import type { Quad, ScaleCalibration, Scene, ScreenElement } from './types';

const scale: ScaleCalibration = { realLength: 2, pxLength: 200, pxPerMeter: 100 };

const rect: Quad = [
  { x: 0, y: 0 },
  { x: 400, y: 0 },
  { x: 400, y: 200 },
  { x: 0, y: 200 },
];

const sampleElement: ScreenElement = {
  id: 'el1',
  name: 'Main',
  corners: rect,
  videoId: null,
  cabinetPlan: { cols: 8, rows: 4, cabinetSide: 0.5, pitch: '2.6' },
};

describe('escapeHtml', () => {
  it('escapes the core five characters', () => {
    expect(escapeHtml('<b>"a&\'"</b>')).toBe('&lt;b&gt;&quot;a&amp;&#39;&quot;&lt;/b&gt;');
  });

  it('stringifies non-strings', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('formatDistanceLabel', () => {
  it('formats in metres when scale is known', () => {
    expect(formatDistanceLabel(200, scale)).toBe('2.00 м');
  });

  it('falls back to pixels without scale', () => {
    expect(formatDistanceLabel(123.456, null)).toBe('123.5 px');
  });
});

describe('getElementDistanceLabels', () => {
  it('measures all 4 edges + both diagonals', () => {
    const labels = getElementDistanceLabels({ corners: rect }, scale);
    expect(labels.top).toBe('4.00 м');
    expect(labels.right).toBe('2.00 м');
    expect(labels.bottom).toBe('4.00 м');
    expect(labels.left).toBe('2.00 м');
    expect(labels.diagMain).toMatch(/м$/);
    expect(labels.diagCross).toMatch(/м$/);
  });
});

describe('collectScreenMetric', () => {
  it('produces fully-populated row with cabinet stats', () => {
    const row = collectScreenMetric(sampleElement, 0, scale);
    expect(row.screen).toBe('Main');
    expect(row.pitch).toBe('P2.6');
    expect(row.sizeW).toBe('4.00');
    expect(row.sizeH).toBe('2.00');
    expect(row.area).toBe('8.00');
    expect(row.cabTotal).toBe(32);
    expect(row.inBounds).toBe(32);
    expect(row.overflow).toBe(0);
    expect(row.resolution).toBe(`${8 * 192} x ${4 * 192}`);
  });

  it('returns placeholders without scale calibration', () => {
    const row = collectScreenMetric(sampleElement, 0, null);
    expect(row.sizeW).toBe('—');
    expect(row.sizeH).toBe('—');
    expect(row.area).toBe('—');
  });

  it('returns name fallback when element has no name', () => {
    const noName: ScreenElement = { ...sampleElement, name: '' };
    const row = collectScreenMetric(noName, 2, scale);
    expect(row.screen).toBe('Экран 3');
  });
});

describe('buildSceneReport + buildReportHtml', () => {
  const scene: Scene = {
    id: 's1',
    name: 'Main hall',
    backgrounds: [],
    activeBackgroundId: null,
    elements: [sampleElement],
    selectedElementId: null,
    selectedFloorPlanObject: null,
    scaleCalib: scale,
    view: { scale: 1, minScale: 0.35, maxScale: 6, offsetX: 0, offsetY: 0 },
    canvasWidth: 1280,
    canvasHeight: 720,
    venue: null,
    floorPlanView: { scale: 50, minScale: 5, maxScale: 200, offsetX: 0, offsetY: 0 },
  };

  it('builds a scene report with one row', () => {
    const sr = buildSceneReport(scene, 'data:image/png;base64,ZZZ');
    expect(sr.name).toBe('Main hall');
    expect(sr.rows).toHaveLength(1);
    expect(sr.snapshotImage).toContain('base64');
  });

  it('generates valid-looking HTML with totals', () => {
    const sr = buildSceneReport(scene, 'data:image/png;base64,ZZZ');
    const html = buildReportHtml([sr], '2026-04-23 10:00');
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Отчет по сценам');
    expect(html).toContain('2026-04-23 10:00');
    expect(html).toContain('Экранов: <b>1</b>');
    expect(html).toContain('Кабинетов всего: <b>32</b>');
    expect(html).toContain('Main hall');
  });

  it('shows fallback message when there are no scenes', () => {
    const html = buildReportHtml([], '2026-04-23');
    expect(html).toContain('Нет данных по сценам');
  });
});
