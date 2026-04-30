import { useCallback, useEffect, useRef, useState } from 'react';
import type { FloorPlanObjectSelection, Point, StageVenue } from '../../lib/visualLed';
import {
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

type VenueDragTarget = FloorPlanObjectSelection;

const FloorPlanStage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scene = useActiveScene();
  const { dispatch } = useVisualLed();
  const [dropActive, setDropActive] = useState(false);
  const [activeTool, setActiveTool] = useState<FloorPlanTool>('select');
  const [toolPoints, setToolPoints] = useState<Point[]>([]);
  const [touchMode, setTouchMode] = useState(false);
  const [stageRectStart, setStageRectStart] = useState<Point | null>(null);

  const view = scene.floorPlanView;

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let preview: { type: string; points: Point[] } | null = null;
    if (stageRectStart) {
      // Stage rect preview will be handled differently
    } else if (toolPoints.length > 0) {
      preview = { type: activeTool, points: toolPoints };
    }

    renderFloorPlan(ctx, scene, view, {
      selectedElementId: scene.selectedElementId,
      selectedFloorPlanObject: scene.selectedFloorPlanObject,
      toolPreview: preview,
      stageRectPreview: stageRectStart
        ? { start: stageRectStart, current: stageRectCurrentRef.current }
        : null,
    });
  }, [scene, view, activeTool, toolPoints, stageRectStart]);

  const stageRectCurrentRef = useRef<Point>({ x: 0, y: 0 });

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

  const findNearestWallPoint = useCallback(
    (p: Point) => {
      if (!scene.venue) return null;
      let best: { kind: 'wall' | 'partition'; id: string; distance: number } | null = null;
      for (const wall of scene.venue.walls) {
        const d = pointToSegmentDistance(p, { x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 });
        if (!best || d < best.distance) {
          best = { kind: 'wall', id: wall.id, distance: d };
        }
      }
      for (const part of scene.venue.partitions) {
        const d = pointToSegmentDistance(p, { x: part.x1, y: part.y1 }, { x: part.x2, y: part.y2 });
        if (!best || d < best.distance) {
          best = { kind: 'partition', id: part.id, distance: d };
        }
      }
      return best;
    },
    [scene.venue],
  );

  const findVenueObjectAt = useCallback(
    (p: Point): VenueDragTarget | null => {
      if (!scene.venue) return null;

      // Doors / windows live on top of walls, so they need to win hit testing.
      for (const door of scene.venue.doors) {
        const wall = scene.venue.walls.find((w) => w.id === door.wallId);
        if (!wall) continue;
        const wallLen = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
        if (wallLen < 1e-6) continue;
        const projected = projectPointToSegment(p, { x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 });
        const offsetDelta = Math.abs(projected.t * wallLen - door.offset);
        if (projected.distance < 0.45 && offsetDelta <= Math.max(door.width, 0.35)) {
          return { kind: 'door', id: door.id };
        }
      }

      for (const window of scene.venue.windows) {
        const wall = scene.venue.walls.find((w) => w.id === window.wallId);
        if (!wall) continue;
        const wallLen = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
        if (wallLen < 1e-6) continue;
        const projected = projectPointToSegment(p, { x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 });
        const offsetDelta = Math.abs(projected.t * wallLen - window.offset);
        if (projected.distance < 0.3 && offsetDelta <= Math.max(window.width / 2, 0.25)) {
          return { kind: 'window', id: window.id };
        }
      }

      // Stage
      if (scene.venue.stage) {
        const s = scene.venue.stage;
        const cos = Math.cos((s.rotation * Math.PI) / 180);
        const sin = Math.sin((s.rotation * Math.PI) / 180);
        const localX = (p.x - s.x) * cos + (p.y - s.y) * sin;
        const localY = -(p.x - s.x) * sin + (p.y - s.y) * cos;
        if (
          localX >= -s.width / 2 &&
          localX <= s.width / 2 &&
          localY >= -s.depth / 2 &&
          localY <= s.depth / 2
        ) {
          return { kind: 'stage', id: s.id };
        }
      }

      // Columns
      for (const col of scene.venue.columns) {
        if (Math.hypot(p.x - col.x, p.y - col.y) <= Math.max(col.diameter / 2, 0.15)) {
          return { kind: 'column', id: col.id };
        }
      }

      // Walls / partitions
      const nearest = findNearestWallPoint(p);
      if (nearest && nearest.distance < 0.2) {
        return { kind: nearest.kind, id: nearest.id };
      }

      return null;
    },
    [scene.venue, findNearestWallPoint],
  );

  // Drag state
  const dragRef = useRef<
    | { type: 'pan'; lastClientX: number; lastClientY: number }
    | { type: 'move'; id: string; last: Point }
    | { type: 'rotate'; id: string; center: Point }
    | { type: 'venueMove'; target: VenueDragTarget; last: Point }
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
          setStageRectStart(null);
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
        const nearest = findNearestWallPoint(p);
        if (nearest && nearest.distance < 0.5) {
          const wall = scene.venue?.walls.find((w) => w.id === nearest.id);
          if (wall) {
            const wallLen = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
            const proj = projectPointToSegment(p, { x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 });
            const isDoor = activeTool === 'door';
            const width = isDoor ? 0.9 : 1.2;
            const halfWidth = Math.min(width / 2, wallLen / 2);
            const offset = isDoor
              ? Math.max(halfWidth, Math.min(wallLen - halfWidth, proj.t * wallLen))
              : proj.t * wallLen;
            dispatch({
              type: isDoor ? 'venue/door/add' : 'venue/window/add',
              payload: {
                id: uid(isDoor ? 'door' : 'win'),
                wallId: wall.id,
                offset,
                width,
                ...(isDoor ? { swing: 'left' as const, swingSide: 'inside' as const } : {}),
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
        setStageRectStart(p);
        stageRectCurrentRef.current = p;
        canvas.setPointerCapture(event.pointerId);
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

      // Venue object drag
      const venueObj = findVenueObjectAt(p);
      if (venueObj) {
        canvas.setPointerCapture(event.pointerId);
        dragRef.current = { type: 'venueMove', target: venueObj, last: p };
        dispatch({ type: 'floorPlan/selectObject', payload: venueObj });
        return;
      }

      // Click empty space = deselect
      dispatch({ type: 'screen/select', payload: { id: null } });
      dispatch({ type: 'floorPlan/selectObject', payload: null });
    },
    [activeTool, toolPoints, dispatch, scene, view, getPointerWorld, findScreenAt, findRotateHandleAt, findVenueObjectAt, findNearestWallPoint, touchMode, canvasMidpoint],
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
      if (!drag) {
        // Stage rect preview
        if (stageRectStart) {
          stageRectCurrentRef.current = getPointerWorld(event.clientX, event.clientY);
          // Force re-render
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              renderFloorPlan(ctx, scene, view, {
                selectedElementId: scene.selectedElementId,
                selectedFloorPlanObject: scene.selectedFloorPlanObject,
                stageRectPreview: { start: stageRectStart, current: stageRectCurrentRef.current },
              });
            }
          }
        }
        return;
      }

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
        const rotation = (angle * 180) / Math.PI + 90;
        dispatch({
          type: 'screen/updatePlacement',
          payload: { id: drag.id, patch: { rotation } },
        });
        return;
      }

      if (drag.type === 'venueMove') {
        const dx = p.x - drag.last.x;
        const dy = p.y - drag.last.y;
        const target = drag.target;

        if (target.kind === 'wall') {
          const wall = scene.venue?.walls.find((w) => w.id === target.id);
          if (wall) {
            dispatch({
              type: 'venue/wall/update',
              payload: {
                id: target.id,
                patch: { x1: wall.x1 + dx, y1: wall.y1 + dy, x2: wall.x2 + dx, y2: wall.y2 + dy },
              },
            });
          }
        } else if (target.kind === 'partition') {
          const part = scene.venue?.partitions.find((p) => p.id === target.id);
          if (part) {
            dispatch({
              type: 'venue/partition/update',
              payload: {
                id: target.id,
                patch: { x1: part.x1 + dx, y1: part.y1 + dy, x2: part.x2 + dx, y2: part.y2 + dy },
              },
            });
          }
        } else if (target.kind === 'column') {
          const col = scene.venue?.columns.find((c) => c.id === target.id);
          if (col) {
            dispatch({
              type: 'venue/column/update',
              payload: {
                id: target.id,
                patch: { x: col.x + dx, y: col.y + dy },
              },
            });
          }
        } else if (target.kind === 'door') {
          const door = scene.venue?.doors.find((d) => d.id === target.id);
          const wall = door ? scene.venue?.walls.find((w) => w.id === door.wallId) : null;
          if (door && wall) {
            const wallLen = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
            const projected = projectPointToSegment(p, { x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 });
            const halfDoorWidth = Math.min(door.width / 2, wallLen / 2);
            dispatch({
              type: 'venue/door/update',
              payload: {
                id: target.id,
                patch: { offset: Math.max(halfDoorWidth, Math.min(wallLen - halfDoorWidth, projected.t * wallLen)) },
              },
            });
          }
        } else if (target.kind === 'window') {
          const window = scene.venue?.windows.find((w) => w.id === target.id);
          const wall = window ? scene.venue?.walls.find((w) => w.id === window.wallId) : null;
          if (window && wall) {
            const wallLen = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
            const projected = projectPointToSegment(p, { x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 });
            dispatch({
              type: 'venue/window/update',
              payload: { id: target.id, patch: { offset: Math.max(0, Math.min(wallLen, projected.t * wallLen)) } },
            });
          }
        } else if (target.kind === 'stage') {
          const stage = scene.venue?.stage;
          if (stage) {
            dispatch({
              type: 'venue/stage/set',
              payload: { ...stage, x: stage.x + dx, y: stage.y + dy },
            });
          }
        }

        drag.last = p;
      }
    },
    [dispatch, scene, view, getPointerWorld, canvasMidpoint, stageRectStart],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      activePointersRef.current.delete(event.pointerId);
      if (activePointersRef.current.size < 2) pinchRef.current = null;

      // Stage rect completion
      if (stageRectStart) {
        const end = getPointerWorld(event.clientX, event.clientY);
        const w = Math.abs(end.x - stageRectStart.x);
        const d = Math.abs(end.y - stageRectStart.y);
        if (w > 0.3 && d > 0.3) {
          const stage: StageVenue = {
            id: uid('stage'),
            x: (stageRectStart.x + end.x) / 2,
            y: (stageRectStart.y + end.y) / 2,
            width: w,
            depth: d,
            height: 0.6,
            rotation: 0,
          };
          dispatch({ type: 'venue/stage/set', payload: stage });
        }
        setStageRectStart(null);
        dragRef.current = null;
        return;
      }

      if (activePointersRef.current.size === 0) dragRef.current = null;
    },
    [stageRectStart, getPointerWorld, dispatch],
  );

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
        if (scene.selectedFloorPlanObject) {
          const selected = scene.selectedFloorPlanObject;
          if (selected.kind === 'wall') dispatch({ type: 'venue/wall/remove', payload: { id: selected.id } });
          else if (selected.kind === 'partition') dispatch({ type: 'venue/partition/remove', payload: { id: selected.id } });
          else if (selected.kind === 'door') dispatch({ type: 'venue/door/remove', payload: { id: selected.id } });
          else if (selected.kind === 'window') dispatch({ type: 'venue/window/remove', payload: { id: selected.id } });
          else if (selected.kind === 'column') dispatch({ type: 'venue/column/remove', payload: { id: selected.id } });
          else if (selected.kind === 'stage') dispatch({ type: 'venue/stage/set', payload: null });
          return;
        }
        if (!scene.selectedElementId) return;
        dispatch({ type: 'screen/setPlacement', payload: { id: scene.selectedElementId, placement: null } });
      }
      if (e.key === 'Escape') {
        setToolPoints([]);
        setStageRectStart(null);
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
  }, [dispatch, scene.selectedElementId, scene.selectedFloorPlanObject]);

  return (
    <div
      className={`relative flex min-h-[420px] flex-1 items-center justify-center overflow-hidden rounded-xl border p-3 transition-colors ${
        dropActive ? 'border-brand-400 bg-brand-500/5' : 'border-white/10 bg-slate-950/40'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
      onDragLeave={() => setDropActive(false)}
      onDrop={(e) => { e.preventDefault(); setDropActive(false); }}
    >
      <FloorPlanToolbar activeTool={activeTool} onToolChange={(t) => { setActiveTool(t); setToolPoints([]); setStageRectStart(null); }} />
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="max-h-full max-w-full touch-none rounded-lg border border-white/5 shadow-xl"
        style={{ cursor: activeTool === 'select' ? 'default' : activeTool === 'stage' ? 'crosshair' : 'crosshair' }}
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
