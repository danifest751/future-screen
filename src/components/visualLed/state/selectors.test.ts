import { describe, expect, it } from 'vitest';
import { isOnboardingMode } from './selectors';
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
