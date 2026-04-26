/**
 * Procedural demo "videos" — pure canvas draw functions driven by a
 * phase `t ∈ [0, 1)` that wraps every LOOP_MS. Rendered live on hidden
 * canvases by VideoPool, then warped onto the selected screen by the
 * main canvas renderer.
 *
 * Using canvas animations instead of recorded WebM dodges two real
 * problems with MediaRecorder-generated demos:
 *  1. HTMLVideoElement's `loop` attribute has a ~30–100ms browser-
 *     imposed stall at the seam — visible as a jerk every cycle.
 *  2. MediaRecorder data URLs run into CSP media-src, codec quirks,
 *     and large payload size.
 * Canvas draws are seamless, zero-storage, and faster to "render".
 */

const CANVAS_W = 320;
const CANVAS_H = 180;
const LOOP_MS = 2800;

export type DemoAnimationKind =
  | 'equalizer'
  | 'spectrum'
  | 'ripple'
  | 'pulse'
  | 'matrix'
  | 'aurora'
  | 'tunnel'
  | 'particles'
  | 'kaleidoscope'
  | 'radar';

export interface DemoSpec {
  kind: DemoAnimationKind;
  name: string;
}

export const DEMO_SPECS: readonly DemoSpec[] = [
  { kind: 'equalizer', name: 'Equalizer' },
  { kind: 'spectrum', name: 'Spectrum' },
  { kind: 'ripple', name: 'Ripple' },
  { kind: 'pulse', name: 'Pulse' },
  { kind: 'matrix', name: 'Matrix' },
  { kind: 'aurora', name: 'Aurora' },
  { kind: 'tunnel', name: 'Tunnel' },
  { kind: 'particles', name: 'Particles' },
  { kind: 'kaleidoscope', name: 'Kaleidoscope' },
  { kind: 'radar', name: 'Radar' },
];

/** Phase utility: 0..1 wrapping at LOOP_MS. */
export function demoPhase(nowMs: number): number {
  return (nowMs % LOOP_MS) / LOOP_MS;
}

export const DEMO_CANVAS_WIDTH = CANVAS_W;
export const DEMO_CANVAS_HEIGHT = CANVAS_H;

type DrawFn = (ctx: CanvasRenderingContext2D, t: number) => void;

function drawBackground(ctx: CanvasRenderingContext2D, from: string, to: string) {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

/** Equalizer — classic vertical bars driven by a phased sine wave. */
const drawEqualizer: DrawFn = (ctx, t) => {
  drawBackground(ctx, '#0b1222', '#0f172a');
  const bars = 24;
  const gap = 2;
  const barW = (CANVAS_W - gap * (bars + 1)) / bars;
  const phase = t * Math.PI * 2;
  for (let i = 0; i < bars; i += 1) {
    const f1 = Math.sin(phase + i * 0.42) * 0.5 + 0.5;
    const f2 = Math.sin(phase * 1.7 + i * 0.85) * 0.5 + 0.5;
    const v = Math.max(0.12, (f1 * 0.65 + f2 * 0.35) * 0.9);
    const h = v * (CANVAS_H - 16);
    const x = gap + i * (barW + gap);
    const y = CANVAS_H - 8 - h;
    const hue = 200 + i * 4;
    const grad = ctx.createLinearGradient(x, y, x, CANVAS_H);
    grad.addColorStop(0, `hsl(${hue}, 85%, 62%)`);
    grad.addColorStop(1, `hsl(${hue + 30}, 70%, 38%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barW, h);
  }
};

/** Spectrum — three overlapping sine waves in neon colours. */
const drawSpectrum: DrawFn = (ctx, t) => {
  drawBackground(ctx, '#0a0f1e', '#141d36');
  const phase = t * Math.PI * 2;
  const waves: Array<{ amp: number; freq: number; offset: number; color: string }> = [
    { amp: 22, freq: 0.03, offset: 0, color: 'rgba(96, 165, 250, 0.75)' },
    { amp: 30, freq: 0.025, offset: phase, color: 'rgba(168, 85, 247, 0.7)' },
    { amp: 18, freq: 0.045, offset: phase * 1.5, color: 'rgba(236, 72, 153, 0.65)' },
  ];
  for (const wave of waves) {
    ctx.beginPath();
    for (let x = 0; x <= CANVAS_W; x += 2) {
      const y = CANVAS_H / 2 + Math.sin(x * wave.freq + wave.offset) * wave.amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = wave.color;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
};

/** Ripple — concentric circles expanding from centre, fade as they grow. */
const drawRipple: DrawFn = (ctx, t) => {
  drawBackground(ctx, '#020617', '#0b2340');
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  const maxR = Math.hypot(cx, cy);
  const rings = 5;
  for (let i = 0; i < rings; i += 1) {
    const phase = (t + i / rings) % 1;
    const r = phase * maxR;
    const alpha = Math.max(0, 1 - phase);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.9})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(125, 211, 252, 0.9)';
  ctx.fill();
};

/** Pulse — breathing radial gradient with bright core. */
const drawPulse: DrawFn = (ctx, t) => {
  drawBackground(ctx, '#050914', '#0f172a');
  const phase = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  const rInner = 20 + phase * 18;
  const rOuter = 70 + phase * 40;
  const grad = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
  grad.addColorStop(0, `rgba(236, 72, 153, ${0.5 + phase * 0.35})`);
  grad.addColorStop(0.5, `rgba(168, 85, 247, ${0.35 + phase * 0.25})`);
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.beginPath();
  ctx.arc(cx, cy, 8 + phase * 6, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + phase * 0.3})`;
  ctx.fill();
};

/** Matrix — pre-seeded deterministic digital rain. */
interface MatrixColumn {
  x: number;
  offset: number;
  chars: string;
}
let matrixColumns: MatrixColumn[] | null = null;
const drawMatrix: DrawFn = (ctx, t) => {
  if (!matrixColumns) {
    const cols = 22;
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*アイウエオカキクケコサシスセソ';
    matrixColumns = Array.from({ length: cols }, (_, i) => ({
      x: (i / cols) * CANVAS_W,
      offset: (i * 0.37) % 1,
      chars: Array.from(
        { length: 20 },
        (_, j) => charset[(i * 13 + j * 29) % charset.length],
      ).join(''),
    }));
  }
  drawBackground(ctx, '#020617', '#021606');
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textBaseline = 'top';
  for (const col of matrixColumns) {
    const phase = (t + col.offset) % 1;
    const head = phase * (CANVAS_H + 40) - 20;
    const trail = 18;
    for (let k = 0; k < trail; k += 1) {
      const y = head - k * 10;
      if (y < -10 || y > CANVAS_H) continue;
      const alpha = k === 0 ? 1 : Math.max(0, (1 - k / trail) * 0.85);
      const g = k === 0 ? 255 : 180;
      ctx.fillStyle = `rgba(34, ${g}, 94, ${alpha})`;
      ctx.fillText(col.chars[k % col.chars.length], col.x, y);
    }
  }
};

/** Aurora — soft layered horizontal bands drifting like northern lights. */
const drawAurora: DrawFn = (ctx, t) => {
  drawBackground(ctx, '#020617', '#0b1830');
  const phase = t * Math.PI * 2;
  const layers = [
    { hue: 160, amp: 18, freq: 0.014, offset: 0, alpha: 0.45 },
    { hue: 200, amp: 26, freq: 0.012, offset: phase * 0.7, alpha: 0.35 },
    { hue: 280, amp: 22, freq: 0.018, offset: -phase * 0.5, alpha: 0.32 },
  ];
  for (const layer of layers) {
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_H);
    for (let x = 0; x <= CANVAS_W; x += 4) {
      const y =
        CANVAS_H * 0.45 +
        Math.sin(x * layer.freq + layer.offset) * layer.amp +
        Math.sin(x * layer.freq * 2.1 + layer.offset * 1.4) * (layer.amp * 0.4);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(CANVAS_W, CANVAS_H);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, `hsla(${layer.hue}, 90%, 55%, ${layer.alpha})`);
    grad.addColorStop(1, 'hsla(220, 30%, 8%, 0)');
    ctx.fillStyle = grad;
    ctx.fill();
  }
};

/** Tunnel — concentric rotating rectangles giving a depth illusion. */
const drawTunnel: DrawFn = (ctx, t) => {
  drawBackground(ctx, '#000', '#0a0a1a');
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  const rings = 14;
  for (let i = 0; i < rings; i += 1) {
    const phase = ((t + i / rings) % 1);
    const scale = phase * 1.6;
    const w = CANVAS_W * scale;
    const h = CANVAS_H * scale;
    const angle = (t * Math.PI * 2) + i * 0.18;
    const alpha = Math.max(0, 1 - phase) * 0.85;
    const hue = (i * 25 + t * 240) % 360;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = `hsla(${hue}, 85%, 60%, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
};

/** Particles — deterministic floating dots with parallax. */
interface Particle {
  x0: number;
  y0: number;
  speed: number;
  hue: number;
  size: number;
}
let particleSeed: Particle[] | null = null;
const drawParticles: DrawFn = (ctx, t) => {
  if (!particleSeed) {
    particleSeed = Array.from({ length: 80 }, (_, i) => ({
      x0: ((i * 53) % 1000) / 1000,
      y0: ((i * 137) % 1000) / 1000,
      speed: 0.3 + ((i * 17) % 100) / 140,
      hue: (i * 23) % 360,
      size: 1 + ((i * 7) % 4),
    }));
  }
  drawBackground(ctx, '#020617', '#050b1c');
  for (const p of particleSeed) {
    const y = ((p.y0 + t * p.speed) % 1) * CANVAS_H;
    const x = p.x0 * CANVAS_W;
    const flicker = 0.55 + Math.sin(t * Math.PI * 2 * p.speed * 6 + p.x0 * 17) * 0.3;
    ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${flicker})`;
    ctx.beginPath();
    ctx.arc(x, y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
};

/** Kaleidoscope — radial mirrored arcs that shift palette over loop. */
const drawKaleidoscope: DrawFn = (ctx, t) => {
  drawBackground(ctx, '#02030a', '#0a0418');
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  const segments = 12;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * Math.PI * 2);
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const hue = (i * 30 + t * 360) % 360;
    ctx.fillStyle = `hsla(${hue}, 80%, 55%, 0.6)`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 90, angle, angle + Math.PI / segments);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

/** Radar — sweeping line over concentric rings. */
const drawRadar: DrawFn = (ctx, t) => {
  drawBackground(ctx, '#020a0e', '#04161c');
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  const maxR = Math.min(cx, cy) - 8;
  // rings
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i += 1) {
    ctx.beginPath();
    ctx.arc(cx, cy, (maxR * i) / 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  // crosshairs
  ctx.beginPath();
  ctx.moveTo(cx - maxR, cy);
  ctx.lineTo(cx + maxR, cy);
  ctx.moveTo(cx, cy - maxR);
  ctx.lineTo(cx, cy + maxR);
  ctx.stroke();
  // sweep
  const angle = t * Math.PI * 2;
  const grad = ctx.createConicGradient(angle, cx, cy);
  grad.addColorStop(0, 'rgba(34, 197, 94, 0.7)');
  grad.addColorStop(0.15, 'rgba(34, 197, 94, 0)');
  grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
  ctx.fill();
  // pings — deterministic so loop seamlessly
  const pings = [
    { angle: 0.6, dist: 0.55 },
    { angle: 2.1, dist: 0.32 },
    { angle: 4.2, dist: 0.78 },
  ];
  for (const ping of pings) {
    const visible = ((angle - ping.angle + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
    const alpha = Math.max(0, 1 - visible * 1.5);
    if (alpha <= 0) continue;
    const px = cx + Math.cos(ping.angle) * ping.dist * maxR;
    const py = cy + Math.sin(ping.angle) * ping.dist * maxR;
    ctx.fillStyle = `rgba(134, 239, 172, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }
};

export const DEMO_DRAWERS: Record<DemoAnimationKind, DrawFn> = {
  equalizer: drawEqualizer,
  spectrum: drawSpectrum,
  ripple: drawRipple,
  pulse: drawPulse,
  matrix: drawMatrix,
  aurora: drawAurora,
  tunnel: drawTunnel,
  particles: drawParticles,
  kaleidoscope: drawKaleidoscope,
  radar: drawRadar,
};
