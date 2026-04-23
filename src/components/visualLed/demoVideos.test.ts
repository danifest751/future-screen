import { describe, expect, it } from 'vitest';
import {
  DEMO_CANVAS_HEIGHT,
  DEMO_CANVAS_WIDTH,
  DEMO_DRAWERS,
  DEMO_SPECS,
  demoPhase,
} from './demoVideos';

describe('demoVideos metadata', () => {
  it('has all expected procedural demos and drawers', () => {
    const kinds = DEMO_SPECS.map((s) => s.kind);
    expect(kinds).toEqual(['equalizer', 'spectrum', 'ripple', 'pulse', 'matrix']);

    for (const kind of kinds) {
      expect(typeof DEMO_DRAWERS[kind]).toBe('function');
    }
  });

  it('exposes stable demo canvas size', () => {
    expect(DEMO_CANVAS_WIDTH).toBe(320);
    expect(DEMO_CANVAS_HEIGHT).toBe(180);
  });
});

describe('demoPhase', () => {
  it('wraps current time into [0, 1)', () => {
    expect(demoPhase(0)).toBe(0);
    expect(demoPhase(1400)).toBeCloseTo(0.5, 5);
    expect(demoPhase(2800)).toBeCloseTo(0, 5);
    expect(demoPhase(4200)).toBeCloseTo(0.5, 5);
  });
});

