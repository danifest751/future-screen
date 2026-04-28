import { useCallback, useEffect, useRef, useState } from 'react';
import type { Point, ScreenPlacement } from '../../lib/visualLed';
import {
  checkBackWallDistance,
  getScreenAssemblyDepth,
  getScreenPhysicalSize,
  getScreenRectOnPlan,
  pointToSegmentDistance,
  projectPointToSegment,
} from '../../lib/visualLed/floorPlanGeometry';
import FloorPlanToolbar, { type FloorPlanTool } from './FloorPlanToolbar';
import { renderFloorPlan } from './floorPlanRenderer';
import { uid } from './state/initialState';
import { useActiveScene, useVisualLed } from './state/VisualLedContext';

const CANVAS_W = 1280;
const CANVAS_H = 720;

const FloorPlanStage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scene = useActiveScene();
  const { state, dispatch } = useVisualLed();
  const [dropActive, setDropActive] = useState(false);
  const [activeTool, setActiveTool] = useState<FloorPlanTool>('select');
  const [toolPoints, setToolPoints] = useState<Point[]>([]);
  const [touchMode, setTouchMode] = useState(false);

  const view = scene.floorPlanView;

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderFloorPlan(ctx, scene, view, {
      selectedElementId: scene.selectedElementId,
      toolPreview:
        toolPoints.length > 0 ? { type: activeTool, points: toolPoints } : null,
    });
  }, [scene, view, activeTool, toolPoints]);

  // Helpers
  const getPointerWorld = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) * canvas.width) / rect.width;
      const y = ((clientY - rect.top) * canvas.height) / rect.height;
      return {
        x: (x - view.offsetX) / view.scale,
        y: (y - view.offsetY) / view.scale,
      };
    },
    [view],
  );

  const findScreenAt = useCallback(
    (p: Point) => {
      for (let i = scene.elements.length - 1; i >= 0; i--) {
        const el = scene.elements[i];
        if (!el.placement) continue;
        const size = getScreenPhysicalSize(el);
        const widthM = size?.width ?? 2;
        const depthM = getScreenAssemblyDepth(el.placement.mountType);
        const quad = getScreenRectOnPlan(el.placement, widthM, depthM);
        // Simple point-in-rect test via half-planes or bounding box
        const minX = Math.min(quad[0].x, quad[1].x, quad[2].x, quad[3].x);
        const maxX = Math.max(quad[0].x, quad[1].x, quad[2].x, quad[3].x);
        const minY = Math.min(quad[0].y, quad[1].y, quad[2].y, quad[3].y);
        const maxY = Math.max(quad[0].y, quad[1].y, quad[2].y, quad[3].y);
        if (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) {
          return el;
        }
      }
      return null;
    },
    [scene.elements],
  );

  const findRotateHandleAt = useCallback(
    (p: Point, threshold = 0.15) => {
      const selected = scene.elements.find((el) => el.id === scene.selectedElementId);
      if (!selected?.placement) return null;
      const size = getScreenPhysicalSize(selected);
      const widthM = size?.width ?? 2;
      const depthM = getScreenAssemblyDepth(selected.placement.mountType);
      const quad = getScreenRectOnPlan(selected.placement, widthM, depthM);
      const fx = (quad[0].x + quad[1].x) / 2;
      const fy = (quad[0].y + quad[1].y) / 2;
      const frontAngle = ((selected.placement.rotation - 90) * Math.PI) / 180;
      const rx = fx + Math.cos(frontAngle) * 0.5;
      const ry = fy + Math.sin(frontAngle) * 0.5;
      if (Math.hypot(p.x - rx, p.y - ry) <= threshold) {
        return selected;
      }
      return null;
    },
    [scene.elements, scene.selectedElementId],
  );

  const findNearestWall = useCallback(
    (p: Point) => {
      if (!scene.venue) return null;
      let best: { wallId: string; t: number; distance: number; point: Point } | null = null;
      for (const wall of scene.venue.walls) {
        const a = { x: wall.x1, y: wall.y1 };
        const b = { x: wall.x2, y: wall.y2 };
        const proj = projectPointToSegment(p, a, b);
        if (!best || proj.distance < best.distance) {
          best = { wallId: wall.id, t: proj.t, distance: proj.distance, point: proj.point };
        }
      }
      return best;
    },
    [scene.venue],
  );

  // Drag state
  const dragRef = useRef<
    | { type: 'pan'; lastClientX: number; lastClientY: number }
    | { type: 'move'; id: string; last: Point }
    | { type: 'rotate'; id: string; center: Point }
    | null
  >(null);
  const spaceDownRef = useRef(false);
  const activePointersRef = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
  const pinchRef = useRef<{ startDist: number; startScale: number; worldX: number; worldY: number } | null>(null);

  const pointerDistance = (a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) =>
    Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  const canvasMidpoint = useCallback(
    (a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const mx = (a.clientX + b.clientX) / 2;
      const my = (a.clientY + b.clientY) / 2;
      return {
        x: ((mx - rect.left) * canvas.width) / rect.width,
        y: ((my - rect.top) * canvas.height) / rect.height,
      };
    },
    [],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      activePointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
      if (event.pointerType === 'touch' || event.pointerType === 'pen') setTouchMode(true);
      else if (event.pointerType === 'mouse') setTouchMode(false);

      // Pinch
      if (event.pointerType === 'touch' && activePointersRef.current.size === 2) {
        const [a, b] = Array.from(activePointersRef.current.values());
        const startDist = pointerDistance(a, b);
        const mid = canvasMidpoint(a, b);
        if (mid && startDist > 0) {
          dragRef.current = null;
          pinchRef.current = {
            startDist,
            startScale: view.scale,
            worldX: (mid.x - view.offsetX) / view.scale,
            worldY: (mid.y - view.offsetY) / view.scale,
          };
        }
        return;
      }

      // Pan
      const isPan = event.button === 2 || event.button === 1 || (event.button === 0 && spaceDownRef.current);
      if (isPan) {
        event.preventDefault();
        canvas.setPointerCapture(event.pointerId);
        dragRef.current = { type: 'pan', lastClientX: event.clientX, lastClientY: event.clientY };
        return;
      }
      if (event.button !== 0) return;

      const p = getPointerWorld(event.clientX, event.clientY);

      // Tool handling
      if (activeTool === 'wall' || activeTool === 'partition') {
        const nextPoints = [...toolPoints, p];
        if (nextPoints.length >= 2) {
          const isWall = activeTool === 'wall';
          dispatch({
            type: isWall ? 'venue/wall/add' : 'venue/partition/add',
            payload: {
              id: uid(isWall ? 'wall' : 'part'),
              x1: nextPoints[0].x,
              y1: nextPoints[0].y,
              x2: nextPoints[1].x,
              y2: nextPoints[1].y,
              thickness: isWall ? 0.2 : 0.1,
            },
          });
          setToolPoints([]);
        } else {
          setToolPoints(nextPoints);
        }
        return;
      }

      if (activeTool === 'door' || activeTool === 'window') {
        const nearest = findNearestWall(p);
        if (nearest && nearest.distance < 0.5) {
          const wall = scene.venue?.walls.find((w) => w.id === nearest.wallId);
          if (wall) {
            const wallLen = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
            const offset = nearest.t * wallLen;
            const isDoor = activeTool === 'door';
            dispatch({
              type: isDoor ? 'venue/door/add' : 'venue/window/add',
              payload: {
                id: uid(isDoor ? 'door' : 'win'),
                wallId: wall.id,
                offset,
                width: isDoor ? 0.9 : 1.2,
              },
            });
          }
        }
        return;
      }

      if (activeTool === 'column') {
        dispatch({
          type: 'venue/column/add',
          payload: { id: uid('col'), x: p.x, y: p.y, diameter: 0.4 },
        });
        return;
      }

      if (activeTool === 'stage') {
        setToolPoints([p]);
        return;
      }

      // Select / drag screens
      const selected = scene.elements.find((el) => el.id === scene.selectedElementId);
      if (selected?.placement) {
        const rotHandle = findRotateHandleAt(p, touchMode ? 0.25 : 0.15);
        if (rotHandle) {
          canvas.setPointerCapture(event.pointerId);
          dragRef.current = { type: 'rotate', id: rotHandle.id, center: { x: rotHandle.placement!.x, y: rotHandle.placement!.y } };
          return;
        }
      }

      const hitScreen = findScreenAt(p);
      if (hitScreen) {
        canvas.setPointerCapture(event.pointerId);
        dragRef.current = { type: 'move', id: hitScreen.id, last: p };
        dispatch({ type: 'screen/select', payload: { id: hitScreen.id } });
        return;
      }

      // Click empty space = deselect
      dispatch({ type: 'screen/select', payload: { id: null } });
    },
    [activeTool, toolPoints, dispatch, scene, view, getPointerWorld, findScreenAt, findRotateHandleAt, findNearestWall, touchMode, canvasMidpoint],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (activePointersRef.current.has(event.pointerId)) {
        activePointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
      }

      if (pinchRef.current && activePointersRef.current.size === 2) {
        const [a, b] = Array.from(activePointersRef.current.values());
        const newDist = pointerDistance(a, b);
        const mid = canvasMidpoint(a, b);
        if (!mid || newDist <= 0) return;
        const ratio = newDist / pinchRef.current.startDist;
        const nextScale = Math.max(view.minScale, Math.min(view.maxScale, pinchRef.current.startScale * ratio));
        dispatch({
          type: 'floorPlanView/set',
          payload: {
            scale: nextScale,
            offsetX: mid.x - pinchRef.current.worldX * nextScale,
            offsetY: mid.y - pinchRef.current.worldY * nextScale,
          },
        });
        return;
      }

      const drag = dragRef.current;
      if (!drag) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (drag.type === 'pan') {
        const dx = event.clientX - drag.lastClientX;
        const dy = event.clientY - drag.lastClientY;
        const rect = canvas.getBoundingClientRect();
        const ratioX = canvas.width / rect.width;
        const ratioY = canvas.height / rect.height;
        dispatch({
          type: 'floorPlanView/set',
          payload: {
            offsetX: view.offsetX + dx * ratioX,
            offsetY: view.offsetY + dy * ratioY,
          },
        });
        drag.lastClientX = event.clientX;
        drag.lastClientY = event.clientY;
        return;
      }

      const p = getPointerWorld(event.clientX, event.clientY);

      if (drag.type === 'move') {
        const dx = p.x - drag.last.x;
        const dy = p.y - drag.last.y;
        const el = scene.elements.find((e) => e.id === drag.id);
        if (el?.placement) {
          dispatch({
            type: 'screen/updatePlacement',
            payload: { id: drag.id, patch: { x: el.placement.x + dx, y: el.placement.y + dy } },
          });
        }
        drag.last = p;
        return;
      }

      if (drag.type === 'rotate') {
        const angle = Math.atan2(p.y - drag.center.y, p.x - drag.center.x);
        const rotation = (angle * 180) / Math.PI + 90; // +90 because 0 is "up"
        dispatch({
          type: 'screen/updatePlacement',
          payload: { id: drag.id, patch: { rotation } },
        });
      }
    },
    [dispatch, scene, view, getPointerWorld, canvasMidpoint],
  );

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(event.pointerId);
    if (activePointersRef.current.size < 2) pinchRef.current = null;
    if (activePointersRef.current.size === 0) dragRef.current = null;
  }, []);

  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const canvasX = ((event.clientX - rect.left) * canvas.width) / rect.width;
      const canvasY = ((event.clientY - rect.top) * canvas.height) / rect.height;
      const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
      const prevScale = view.scale;
      const nextScale = Math.max(view.minScale, Math.min(view.maxScale, prevScale * factor));
      if (nextScale === prevScale) return;
      const wx = (canvasX - view.offsetX) / prevScale;
      const wy = (canvasY - view.offsetY) / prevScale;
      dispatch({
        type: 'floorPlanView/set',
        payload: {
          scale: nextScale,
          offsetX: canvasX - wx * nextScale,
          offsetY: canvasY - wy * nextScale,
        },
      });
    },
    [dispatch, view],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const tag = (document.activeElement?.tagName ?? '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        spaceDownRef.current = true;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const tag = (document.activeElement?.tagName ?? '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        if (!scene.selectedElementId) return;
        dispatch({ type: 'screen/setPlacement', payload: { id: scene.selectedElementId, placement: null } });
      }
      if (e.key === 'Escape') {
        setToolPoints([]);
        setActiveTool('select');
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDownRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [dispatch, scene.selectedElementId]);

  return (
    <div
      className={`relative flex min-h-[420px] flex-1 items-center justify-center overflow-hidden rounded-xl border p-3 transition-colors ${
        dropActive ? 'border-brand-400 bg-brand-500/5' : 'border-white/10 bg-slate-950/40'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
      onDragLeave={() => setDropActive(false)}
      onDrop={(e) => { e.preventDefault(); setDropActive(false); }}
    >
      <FloorPlanToolbar activeTool={activeTool} onToolChange={(t) => { setActiveTool(t); setToolPoints([]); }} />
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="max-h-full max-w-full touch-none rounded-lg border border-white/5 shadow-xl"
        style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
      {!scene.venue && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="text-sm text-slate-400">План помещения не создан</span>
          <span className="text-xs text-slate-500">Используй панель слева, чтобы создать план</span>
        </div>
      )}
    </div>
  );
};

export default FloorPlanStage;
