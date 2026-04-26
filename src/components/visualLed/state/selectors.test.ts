import { describe, expect, it } from 'vitest';
import type { Scene } from '../../../lib/visualLed';
import { collectSceneMetrics, isOnboardingMode } from './selectors';
import { createInitialState } from './initialState';
import type { VisualLedState } from './types';

const fresh = (): VisualLedState => createInitialState();

describe('isOnboardingMode', () => {
  it('true on a fresh state without URL project', () => {
    expect(isOnboardingMode(fresh(), false)).toBe(true);
  });

  it('false when URL project is present, no matter what', () => {
    expect(isOnboardingMode(fresh(), true)).toBe(false);
  });

  it('false once a preset has been chosen', () => {
    const state: VisualLedState = { ...fresh(), selectedPresetSlug: 'concert' };
    expect(isOnboardingMode(state, false)).toBe(false);
  });

  it('false when any scene already carries a screen', () => {
    const base = fresh();
    const state: VisualLedState = {
      ...base,
      scenes: [
        {
          ...base.scenes[0],
          elements: [
            {
              id: 'scr-1',
              name: 'screen',
              corners: [
                { x: 0, y: 0 },
                { x: 100, y: 0 },
                { x: 100, y: 50 },
                { x: 0, y: 50 },
              ],
              videoId: null,
              cabinetPlan: null,
            },
          ],
        },
      ],
    };
    expect(isOnboardingMode(state, false)).toBe(false);
  });

  it('false when any scene already carries a background (e.g. user dropped a fonовое-image)', () => {
    const base = fresh();
    const state: VisualLedState = {
      ...base,
      scenes: [
        {
          ...base.scenes[0],
          backgrounds: [
            {
              id: 'bg-1',
              name: 'uploaded',
              src: 'data:image/png;base64,AAA',
              width: 800,
              height: 450,
            },
          ],
        },
      ],
    };
    expect(isOnboardingMode(state, false)).toBe(false);
  });
});

describe('collectSceneMetrics', () => {
  it('summarizes selected and total stats across multiple screens', () => {
    const base = fresh();
    const scene: Scene = {
      ...base.scenes[0],
      selectedElementId: 'scr-1',
      scaleCalib: { realLength: 1, pxLength: 100, pxPerMeter: 100 },
      elements: [
        {
          id: 'scr-1',
          name: 'Main',
          corners: [
            { x: 0, y: 0 },
            { x: 400, y: 0 },
            { x: 400, y: 250 },
            { x: 0, y: 250 },
          ],
          videoId: null,
          cabinetPlan: { cols: 8, rows: 5, cabinetSide: 0.5, pitch: '2.6' },
        },
        {
          id: 'scr-2',
          name: 'Side',
          corners: [
            { x: 500, y: 0 },
            { x: 700, y: 0 },
            { x: 700, y: 100 },
            { x: 500, y: 100 },
          ],
          videoId: null,
          cabinetPlan: null,
        },
      ],
    };

    const metrics = collectSceneMetrics(scene);

    expect(metrics.screenCount).toBe(2);
    expect(metrics.selected?.id).toBe('scr-1');
    expect(metrics.selected?.widthM).toBeCloseTo(4);
    expect(metrics.selected?.heightM).toBeCloseTo(2.5);
    expect(metrics.selected?.areaM2).toBeCloseTo(10);
    expect(metrics.selected?.cabinetCount).toBe(40);
    expect(metrics.selected?.resolutionWidth).toBe(1536);
    expect(metrics.selected?.weightMinKg).toBe(240);
    expect(metrics.selected?.weightMaxKg).toBe(320);
    expect(metrics.selected?.maxPowerW).toBe(6400);
    expect(metrics.selected?.averagePowerW).toBe(2200);
    expect(metrics.totalAreaM2).toBeCloseTo(12);
    expect(metrics.totalCabinetCount).toBe(40);
    expect(metrics.totalWeightMinKg).toBe(240);
    expect(metrics.totalWeightMaxKg).toBe(320);
    expect(metrics.totalMaxPowerW).toBe(6400);
    expect(metrics.totalAveragePowerW).toBe(2200);
  });
});
