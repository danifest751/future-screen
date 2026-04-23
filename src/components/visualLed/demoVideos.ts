/**
 * Runtime-generated demo videos — simple canvas animations recorded
 * into WebM blobs via MediaRecorder. Handy for onboarding ("try the
 * visualizer without uploading your own footage") and for sales demos.
 *
 * Five generators: equalizer, spectrum waves, ripples, pulse, digital
 * rain. Each ~2 seconds @ 30fps, 320×180, seamless loop (the render
 * loop uses a continuous phase so end-to-start is smooth).
 */

const WIDTH = 320;
const HEIGHT = 180;
const FPS = 30;
const DURATION_MS = 2200;

export interface DemoVideo {
  name: string;
  src: string;
}

type DrawFrame = (ctx: CanvasRenderingContext2D, t: number) => void;

function pickMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('blob to data URL failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Render `draw(ctx, t)` for DURATION_MS at FPS into a canvas and
 * capture the stream with MediaRecorder. Returns a data URL so the
 * video survives localStorage autosave and reloads.
 */
async function record(draw: DrawFrame): Promise<string> {
  const mime = pickMimeType();
  if (!mime) throw new Error('MediaRecorder not supported');

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');

  const stream = (canvas as HTMLCanvasElement).captureStream(FPS);
  const recorder = new MediaRecorder(stream, { mimeType: mime });
  const chunks: Blob[] = [];
  const stopped = new Promise<Blob>((resolve) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
  });

  recorder.start();
  const start = performance.now();
  let rafId = 0;
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / DURATION_MS, 1);
      draw(ctx, t);
      if (elapsed >= DURATION_MS) {
        resolve();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  });
  cancelAnimationFrame(rafId);
  recorder.stop();
  const blob = await stopped;
  return blobToDataUrl(blob);
}

// ---------- 5 generators ----------

function drawBackground(ctx: CanvasRenderingContext2D, from: string, to: string) {
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

/** Equalizer — classic vertical bars driven by a phased sine wave. */
function drawEqualizer(ctx: CanvasRenderingContext2D, t: number) {
  drawBackground(ctx, '#0b1222', '#0f172a');
  const bars = 24;
  const gap = 2;
  const barW = (WIDTH - gap * (bars + 1)) / bars;
  const phase = t * Math.PI * 2;
  for (let i = 0; i < bars; i += 1) {
    const f1 = Math.sin(phase + i * 0.42) * 0.5 + 0.5;
    const f2 = Math.sin(phase * 1.7 + i * 0.85) * 0.5 + 0.5;
    const v = Math.max(0.12, (f1 * 0.65 + f2 * 0.35) * 0.9);
    const h = v * (HEIGHT - 16);
    const x = gap + i * (barW + gap);
    const y = HEIGHT - 8 - h;
    const hue = 200 + i * 4;
    const grad = ctx.createLinearGradient(x, y, x, HEIGHT);
    grad.addColorStop(0, `hsl(${hue}, 85%, 62%)`);
    grad.addColorStop(1, `hsl(${hue + 30}, 70%, 38%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barW, h);
  }
}

/** Spectrum — overlapping sine waves in neon colours. */
function drawSpectrum(ctx: CanvasRenderingContext2D, t: number) {
  drawBackground(ctx, '#0a0f1e', '#141d36');
  const phase = t * Math.PI * 2;
  const waves: Array<{ amp: number; freq: number; offset: number; color: string }> = [
    { amp: 22, freq: 0.03, offset: 0, color: 'rgba(96, 165, 250, 0.75)' },
    { amp: 30, freq: 0.025, offset: phase, color: 'rgba(168, 85, 247, 0.7)' },
    { amp: 18, freq: 0.045, offset: phase * 1.5, color: 'rgba(236, 72, 153, 0.65)' },
  ];
  for (const wave of waves) {
    ctx.beginPath();
    for (let x = 0; x <= WIDTH; x += 2) {
      const y = HEIGHT / 2 + Math.sin(x * wave.freq + wave.offset) * wave.amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = wave.color;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

/** Ripple — concentric circles expanding from centre. */
function drawRipple(ctx: CanvasRenderingContext2D, t: number) {
  drawBackground(ctx, '#020617', '#0b2340');
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
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
  // Centre dot
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(125, 211, 252, 0.9)';
  ctx.fill();
}

/** Pulse — breathing radial gradient. */
function drawPulse(ctx: CanvasRenderingContext2D, t: number) {
  drawBackground(ctx, '#050914', '#0f172a');
  const phase = Math.sin(t * Math.PI * 2) * 0.5 + 0.5; // 0..1..0
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const rInner = 20 + phase * 18;
  const rOuter = 70 + phase * 40;
  const grad = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
  grad.addColorStop(0, `rgba(236, 72, 153, ${0.5 + phase * 0.35})`);
  grad.addColorStop(0.5, `rgba(168, 85, 247, ${0.35 + phase * 0.25})`);
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  // Bright core
  ctx.beginPath();
  ctx.arc(cx, cy, 8 + phase * 6, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + phase * 0.3})`;
  ctx.fill();
}

/** Matrix — deterministic digital rain. Columns pre-seeded for smooth loop. */
interface MatrixColumn {
  x: number;
  speed: number;
  offset: number;
  chars: string;
}
let matrixColumns: MatrixColumn[] | null = null;
function drawMatrix(ctx: CanvasRenderingContext2D, t: number) {
  if (!matrixColumns) {
    const cols = 22;
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*アイウエオカキクケコサシスセソ';
    matrixColumns = Array.from({ length: cols }, (_, i) => ({
      x: (i / cols) * WIDTH,
      speed: 40 + (i * 7) % 60,
      offset: (i * 0.37) % 1,
      // Pre-sample a column's worth of chars so the loop stays deterministic.
      chars: Array.from({ length: 20 }, (_, j) =>
        charset[(i * 13 + j * 29) % charset.length],
      ).join(''),
    }));
  }
  drawBackground(ctx, '#020617', '#021606');
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textBaseline = 'top';
  for (const col of matrixColumns) {
    const phase = (t + col.offset) % 1;
    const head = phase * (HEIGHT + 40) - 20;
    const trail = 18;
    for (let k = 0; k < trail; k += 1) {
      const y = head - k * 10;
      if (y < -10 || y > HEIGHT) continue;
      const alpha = k === 0 ? 1 : Math.max(0, (1 - k / trail) * 0.85);
      const g = k === 0 ? 255 : 180;
      ctx.fillStyle = `rgba(34, ${g}, 94, ${alpha})`;
      ctx.fillText(col.chars[k % col.chars.length], col.x, y);
    }
  }
}

// ---------- public API ----------

export interface DemoSpec {
  name: string;
  draw: DrawFrame;
}

export const DEMO_SPECS: readonly DemoSpec[] = [
  { name: 'Equalizer', draw: drawEqualizer },
  { name: 'Spectrum', draw: drawSpectrum },
  { name: 'Ripple', draw: drawRipple },
  { name: 'Pulse', draw: drawPulse },
  { name: 'Matrix', draw: drawMatrix },
];

/** Generate all five demo videos sequentially (MediaRecorder doesn't like parallelism). */
export async function generateDemoVideos(
  onProgress?: (done: number, total: number, name: string) => void,
): Promise<DemoVideo[]> {
  const out: DemoVideo[] = [];
  for (let i = 0; i < DEMO_SPECS.length; i += 1) {
    const spec = DEMO_SPECS[i];
    onProgress?.(i, DEMO_SPECS.length, spec.name);
    try {
      const src = await record(spec.draw);
      out.push({ name: `${spec.name}.webm`, src });
    } catch (err) {
      console.warn('[demoVideos] generator failed for', spec.name, err);
    }
  }
  onProgress?.(DEMO_SPECS.length, DEMO_SPECS.length, '');
  return out;
}

export function isDemoRecordingSupported(): boolean {
  return pickMimeType() !== null;
}
