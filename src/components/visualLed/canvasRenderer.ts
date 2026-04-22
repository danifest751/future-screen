import type { Scene, ScreenElement, ViewTransform } from '../../lib/visualLed';
import type { Tool } from './state/types';

/**
 * Render the active scene into the provided 2D context. Pure drawing
 * function — consumes state, produces pixels. Called by `CanvasStage`
 * on every state change.
 *
 * Phase 3a draws background + screens + current tool preview. Cabinet
 * grid, assist overlay, stats HUD come in later phases.
 */
export function renderScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  tool: Tool | null,
  imageCache: Map<string, HTMLImageElement>,
): void {
  const canvas = ctx.canvas;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  applyView(ctx, scene.view);

  // 1. Background
  drawBackground(ctx, scene, imageCache);

  // 2. Screens
  for (const element of scene.elements) {
    drawScreen(ctx, element, element.id === scene.selectedElementId);
  }

  // 3. Tool preview — scale line, placement dots, etc.
  if (tool) drawToolPreview(ctx, tool);

  ctx.restore();
}

function applyView(ctx: CanvasRenderingContext2D, view: ViewTransform): void {
  ctx.translate(view.offsetX, view.offsetY);
  ctx.scale(view.scale, view.scale);
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  imageCache: Map<string, HTMLImageElement>,
): void {
  const canvas = ctx.canvas;
  const activeId = scene.activeBackgroundId;
  const bg = scene.backgrounds.find((b) => b.id === activeId);

  if (!bg) {
    // Empty-state hint.
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#0b1222');
    grad.addColorStop(1, '#050914');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.font = '14px Inter, Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      'Загрузи фон справа или перетащи файл сюда',
      canvas.width / 2,
      canvas.height / 2,
    );
    ctx.restore();
    return;
  }

  const img = imageCache.get(bg.src);
  if (!img) {
    // Cache miss — image still loading; renderer will be re-called on load.
    return;
  }
  // Fit the image to the canvas preserving aspect — legacy does the
  // same via setCanvasFromImage at upload time so this is mostly a
  // safety rail if canvas dims and image dims drift.
  const aspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = canvas.width / canvas.height;
  let drawW = canvas.width;
  let drawH = canvas.height;
  let dx = 0;
  let dy = 0;
  if (aspect > canvasAspect) {
    // Image wider — letterbox top/bottom.
    drawH = canvas.width / aspect;
    dy = (canvas.height - drawH) / 2;
  } else {
    drawW = canvas.height * aspect;
    dx = (canvas.width - drawW) / 2;
  }
  ctx.drawImage(img, dx, dy, drawW, drawH);
}

function drawScreen(
  ctx: CanvasRenderingContext2D,
  element: ScreenElement,
  isSelected: boolean,
): void {
  const [p0, p1, p2, p3] = element.corners;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(11, 16, 22, 0.92)';
  ctx.fill();

  // Video draw comes in phase 4 — needs the video pool in state.

  ctx.lineWidth = isSelected ? 2 : 1;
  ctx.strokeStyle = isSelected ? 'rgba(96, 165, 250, 0.95)' : 'rgba(226, 232, 240, 0.7)';
  ctx.stroke();

  if (isSelected) {
    ctx.fillStyle = 'rgba(96, 165, 250, 1)';
    for (const corner of element.corners) {
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawToolPreview(ctx: CanvasRenderingContext2D, tool: Tool): void {
  if (tool.points.length === 0) return;
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)';
  ctx.fillStyle = 'rgba(251, 191, 36, 1)';

  // Connect consecutive points.
  ctx.beginPath();
  const [first, ...rest] = tool.points;
  ctx.moveTo(first.x, first.y);
  for (const p of rest) ctx.lineTo(p.x, p.y);
  ctx.stroke();

  // Dot per point.
  for (const p of tool.points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
