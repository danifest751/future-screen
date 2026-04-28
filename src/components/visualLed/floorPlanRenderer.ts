import type {
  Column,
  Door,
  Partition,
  Scene,
  ScreenPlacement,
  StageVenue,
  Wall,
  Window,
} from '../../lib/visualLed';
import {
  checkBackWallDistance,
  degToRad,
  getScreenAssemblyDepth,
  getScreenPhysicalSize,
  getScreenRectOnPlan,
  pointToSegmentDistance,
} from '../../lib/visualLed/floorPlanGeometry';
import type { ViewTransform } from '../../lib/visualLed/types';

export interface FloorPlanRenderOptions {
  selectedElementId: string | null;
  toolPreview?: { type: string; points: { x: number; y: number }[] } | null;
}

export function renderFloorPlan(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  view: ViewTransform,
  options: FloorPlanRenderOptions,
): void {
  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = '#0b1222';
  ctx.fillRect(0, 0, w, h);

  // Apply view
  ctx.translate(view.offsetX, view.offsetY);
  ctx.scale(view.scale, view.scale);

  // Grid
  drawGrid(ctx, w, h, view);

  const venue = scene.venue;
  if (venue) {
    // Draw walls
    for (const wall of venue.walls) {
      drawWall(ctx, wall);
    }

    // Draw doors
    for (const door of venue.doors) {
      drawDoor(ctx, door, venue.walls);
    }

    // Draw windows
    for (const window of venue.windows) {
      drawWindow(ctx, window, venue.walls);
    }

    // Draw partitions
    for (const part of venue.partitions) {
      drawPartition(ctx, part);
    }

    // Draw columns
    for (const col of venue.columns) {
      drawColumn(ctx, col);
    }

    // Draw stage
    if (venue.stage) {
      drawStage(ctx, venue.stage, view.scale);
    }
  }

  // Draw placed screens
  for (const el of scene.elements) {
    if (!el.placement) continue;
    const size = getScreenPhysicalSize(el);
    const widthM = size?.width ?? 2;
    const depthM = getScreenAssemblyDepth(el.placement.mountType);
    const isSelected = el.id === options.selectedElementId;
    drawScreenOnPlan(ctx, el.placement, widthM, depthM, el.name, isSelected, view.scale, venue);
  }

  // Tool preview
  if (options.toolPreview && options.toolPreview.points.length > 0) {
    drawToolPreview(ctx, options.toolPreview);
  }
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  view: ViewTransform,
): void {
  const gridSize = 1; // 1 meter
  const startX = Math.floor(-view.offsetX / view.scale / gridSize) * gridSize;
  const startY = Math.floor(-view.offsetY / view.scale / gridSize) * gridSize;
  const endX = startX + canvasW / view.scale + gridSize * 2;
  const endY = startY + canvasH / view.scale + gridSize * 2;

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1 / view.scale;

  for (let x = startX; x <= endX; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }
  for (let y = startY; y <= endY; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }

  // Coordinate labels every 5 meters
  ctx.fillStyle = 'rgba(148,163,184,0.4)';
  ctx.font = `${0.3}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let x = startX; x <= endX; x += gridSize) {
    if (Math.abs(x % 5) < 0.01) {
      ctx.fillText(`${Math.round(x)}м`, x, startY + 0.1);
    }
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let y = startY; y <= endY; y += gridSize) {
    if (Math.abs(y % 5) < 0.01) {
      ctx.fillText(`${Math.round(y)}м`, startX + 0.1, y);
    }
  }
}

function drawWall(ctx: CanvasRenderingContext2D, wall: Wall): void {
  ctx.strokeStyle = 'rgba(226,232,240,0.85)';
  ctx.lineWidth = wall.thickness ?? 0.2;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(wall.x1, wall.y1);
  ctx.lineTo(wall.x2, wall.y2);
  ctx.stroke();
}

function drawPartition(ctx: CanvasRenderingContext2D, part: Partition): void {
  ctx.strokeStyle = 'rgba(226,232,240,0.5)';
  ctx.lineWidth = part.thickness ?? 0.1;
  ctx.setLineDash([0.3, 0.2]);
  ctx.beginPath();
  ctx.moveTo(part.x1, part.y1);
  ctx.lineTo(part.x2, part.y2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawDoor(
  ctx: CanvasRenderingContext2D,
  door: Door,
  walls: Wall[],
): void {
  const wall = walls.find((w) => w.id === door.wallId);
  if (!wall) return;

  const wallLen = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
  if (wallLen < 1e-6) return;

  const t = Math.max(0, Math.min(1, door.offset / wallLen));
  const nx = (wall.x2 - wall.x1) / wallLen;
  const ny = (wall.y2 - wall.y1) / wallLen;

  const cx = wall.x1 + nx * door.offset;
  const cy = wall.y1 + ny * door.offset;

  // Perpendicular
  const px = -ny;
  const py = nx;

  const doorW = door.width;
  const swing = door.swing === 'left' ? 1 : -1;

  // Opening arc
  ctx.strokeStyle = 'rgba(226,232,240,0.6)';
  ctx.lineWidth = 0.02;
  ctx.beginPath();
  ctx.arc(cx, cy, doorW, Math.atan2(ny, nx), Math.atan2(ny, nx) + (swing * Math.PI) / 2, swing < 0);
  ctx.stroke();

  // Door line
  const dx = cx + px * doorW * swing * 0.3;
  const dy = cy + py * doorW * swing * 0.3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(dx, dy);
  ctx.stroke();
}

function drawWindow(
  ctx: CanvasRenderingContext2D,
  window: Window,
  walls: Wall[],
): void {
  const wall = walls.find((w) => w.id === window.wallId);
  if (!wall) return;

  const wallLen = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
  if (wallLen < 1e-6) return;

  const t = Math.max(0, Math.min(1, window.offset / wallLen));
  const nx = (wall.x2 - wall.x1) / wallLen;
  const ny = (wall.y2 - wall.y1) / wallLen;

  const cx = wall.x1 + nx * window.offset;
  const cy = wall.y1 + ny * window.offset;

  const px = -ny * 0.15;
  const py = nx * 0.15;

  ctx.strokeStyle = 'rgba(148,163,184,0.6)';
  ctx.lineWidth = 0.03;
  ctx.beginPath();
  ctx.moveTo(cx - nx * window.width * 0.5 + px, cy - ny * window.width * 0.5 + py);
  ctx.lineTo(cx + nx * window.width * 0.5 + px, cy + ny * window.width * 0.5 + py);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - nx * window.width * 0.5 - px, cy - ny * window.width * 0.5 - py);
  ctx.lineTo(cx + nx * window.width * 0.5 - px, cy + ny * window.width * 0.5 - py);
  ctx.stroke();
}

function drawColumn(ctx: CanvasRenderingContext2D, col: Column): void {
  ctx.fillStyle = 'rgba(148,163,184,0.6)';
  ctx.beginPath();
  ctx.arc(col.x, col.y, col.diameter / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(226,232,240,0.4)';
  ctx.lineWidth = 0.02;
  ctx.stroke();
}

function drawStage(ctx: CanvasRenderingContext2D, stage: StageVenue, viewScale: number): void {
  ctx.save();
  ctx.translate(stage.x, stage.y);
  ctx.rotate(degToRad(stage.rotation));

  ctx.fillStyle = 'rgba(96,165,250,0.12)';
  ctx.strokeStyle = 'rgba(96,165,250,0.55)';
  ctx.lineWidth = 0.04;
  ctx.fillRect(-stage.width / 2, -stage.depth / 2, stage.width, stage.depth);
  ctx.strokeRect(-stage.width / 2, -stage.depth / 2, stage.width, stage.depth);

  // Label
  ctx.fillStyle = 'rgba(96,165,250,0.9)';
  ctx.font = `${0.35 / viewScale}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Сцена', 0, 0);

  ctx.restore();
}

function drawScreenOnPlan(
  ctx: CanvasRenderingContext2D,
  placement: ScreenPlacement,
  widthM: number,
  depthM: number,
  name: string,
  isSelected: boolean,
  viewScale: number,
  venue: import('../../lib/visualLed').Venue | null,
): void {
  const quad = getScreenRectOnPlan(placement, widthM, depthM);

  // Validation: 1.2m from back to wall
  let invalid = false;
  if (venue) {
    const result = checkBackWallDistance(
      placement,
      widthM,
      depthM,
      venue.walls,
      venue.partitions,
      1.2,
    );
    invalid = !result.valid;
  }

  ctx.save();

  // Screen body
  ctx.beginPath();
  ctx.moveTo(quad[0].x, quad[0].y);
  ctx.lineTo(quad[1].x, quad[1].y);
  ctx.lineTo(quad[2].x, quad[2].y);
  ctx.lineTo(quad[3].x, quad[3].y);
  ctx.closePath();

  if (invalid) {
    ctx.fillStyle = 'rgba(239,68,68,0.25)';
  } else {
    ctx.fillStyle = 'rgba(11,16,22,0.92)';
  }
  ctx.fill();

  ctx.strokeStyle = isSelected ? 'rgba(96,165,250,0.95)' : 'rgba(226,232,240,0.7)';
  ctx.lineWidth = isSelected ? 0.04 : 0.02;
  ctx.stroke();

  // Front edge indicator (brighter)
  ctx.strokeStyle = 'rgba(96,165,250,0.8)';
  ctx.lineWidth = 0.03;
  ctx.beginPath();
  ctx.moveTo(quad[0].x, quad[0].y);
  ctx.lineTo(quad[1].x, quad[1].y);
  ctx.stroke();

  // Mount type indicator
  if (placement.mountType === 'suspended') {
    // Small line upward from center
    const cx = (quad[0].x + quad[2].x) / 2;
    const cy = (quad[0].y + quad[2].y) / 2;
    const upAngle = degToRad(placement.rotation - 90);
    ctx.strokeStyle = 'rgba(148,163,184,0.6)';
    ctx.lineWidth = 0.02;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(upAngle) * 0.3, cy + Math.sin(upAngle) * 0.3);
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = invalid ? 'rgba(239,68,68,0.9)' : 'rgba(226,232,240,0.8)';
  ctx.font = `${0.25 / viewScale}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = (quad[0].x + quad[2].x) / 2;
  const cy = (quad[0].y + quad[2].y) / 2;
  ctx.fillText(name, cx, cy - 0.15 / viewScale);
  ctx.fillStyle = 'rgba(148,163,184,0.6)';
  ctx.font = `${0.2 / viewScale}px sans-serif`;
  ctx.fillText(
    `↑${placement.height.toFixed(1)}м ${placement.mountType === 'suspended' ? 'Подвес' : 'Напол'}`,
    cx,
    cy + 0.15 / viewScale,
  );

  // Selection handles
  if (isSelected) {
    for (const p of quad) {
      ctx.fillStyle = 'rgba(96,165,250,1)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 0.08, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rotation handle (above front edge center)
    const fx = (quad[0].x + quad[1].x) / 2;
    const fy = (quad[0].y + quad[1].y) / 2;
    const frontAngle = degToRad(placement.rotation - 90);
    const rx = fx + Math.cos(frontAngle) * 0.5;
    const ry = fy + Math.sin(frontAngle) * 0.5;

    ctx.strokeStyle = 'rgba(96,165,250,0.8)';
    ctx.lineWidth = 0.02;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(rx, ry);
    ctx.stroke();

    ctx.fillStyle = 'rgba(251,191,36,0.9)';
    ctx.beginPath();
    ctx.arc(rx, ry, 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawToolPreview(
  ctx: CanvasRenderingContext2D,
  tool: { type: string; points: { x: number; y: number }[] },
): void {
  if (tool.points.length === 0) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(251,191,36,0.9)';
  ctx.fillStyle = 'rgba(251,191,36,1)';
  ctx.lineWidth = 0.03;

  ctx.beginPath();
  const [first, ...rest] = tool.points;
  ctx.moveTo(first.x, first.y);
  for (const p of rest) ctx.lineTo(p.x, p.y);
  ctx.stroke();

  for (const p of tool.points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
