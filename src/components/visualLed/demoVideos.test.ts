import { describe, expect, it, vi } from 'vitest';
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

describe('DEMO_DRAWERS rendering', () => {
  const createMockCtx = () => {
    const linearGradient = { addColorStop: vi.fn() };
    const radialGradient = { addColorStop: vi.fn() };
    return {
      createLinearGradient: vi.fn(() => linearGradient),
      createRadialGradient: vi.fn(() => radialGradient),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      closePath: vi.fn(),
      clip: vi.fn(),
      drawImage: vi.fn(),
      transform: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      set fillStyle(_value: unknown) {},
      set strokeStyle(_value: unknown) {},
      set lineWidth(_value: unknown) {},
      set font(_value: unknown) {},
      set textBaseline(_value: unknown) {},
    } as unknown as CanvasRenderingContext2D;
  };

  it('draws each animation kind without throwing', () => {
    const kinds = DEMO_SPECS.map((spec) => spec.kind);
    for (const kind of kinds) {
      const ctx = createMockCtx();
      expect(() => DEMO_DRAWERS[kind](ctx, 0.25)).not.toThrow();
    }
  });

  it('renders matrix drawer multiple times (covers seeded + reused columns)', () => {
    const ctx = createMockCtx();
    DEMO_DRAWERS.matrix(ctx, 0.1);
    DEMO_DRAWERS.matrix(ctx, 0.9);

    expect(ctx.fillText).toHaveBeenCalled();
    expect(ctx.createLinearGradient).toHaveBeenCalled();
  });
});
