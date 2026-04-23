import { describe, expect, it } from 'vitest';
import * as visualLed from './index';

describe('visualLed barrel exports', () => {
  it('re-exports primary APIs from extracted modules', () => {
    expect(typeof visualLed.solveAffineForTriangle).toBe('function');
    expect(typeof visualLed.drawWarpedSource).toBe('function');
    expect(typeof visualLed.scaleQuadToMetric).toBe('function');
    expect(typeof visualLed.buildSceneReport).toBe('function');
  });
});
