import { useEffect, useRef } from 'react';
import { useActiveScene } from './state/VisualLedContext';

/**
 * Thin React wrapper around the `<canvas>` element. Keeps the canvas
 * size in sync with the active scene's declared canvasWidth/Height and
 * exposes a ref-based API for the (upcoming) imperative renderer.
 *
 * Phase 2 renders an empty dark background — scene rendering comes in
 * phase 3 when we wire up backgrounds, screens, and tools.
 */
const CanvasStage = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const scene = useActiveScene();

  // Keep canvas pixel size in sync with scene settings.
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (canvas.width !== scene.canvasWidth) canvas.width = scene.canvasWidth;
    if (canvas.height !== scene.canvasHeight) canvas.height = scene.canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Placeholder render: dark gradient + centre hint.
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#0b1222');
    grad.addColorStop(1, '#050914');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '14px Inter, Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      'Canvas preview · scene: ' + scene.name,
      canvas.width / 2,
      canvas.height / 2 - 10,
    );
    ctx.fillStyle = 'rgba(100, 116, 139, 0.8)';
    ctx.font = '11px JetBrains Mono, Consolas, monospace';
    ctx.fillText(
      scene.canvasWidth + ' × ' + scene.canvasHeight + '  ·  ' + scene.elements.length + ' screens',
      canvas.width / 2,
      canvas.height / 2 + 14,
    );
    ctx.restore();
  }, [scene]);

  return (
    <div className="relative flex min-h-[420px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-950/40 p-3">
      <canvas
        ref={ref}
        width={scene.canvasWidth}
        height={scene.canvasHeight}
        className="max-h-full max-w-full rounded-lg border border-white/5 shadow-xl"
      />
    </div>
  );
};

export default CanvasStage;
