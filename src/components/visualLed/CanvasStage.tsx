import { useCallback, useEffect, useRef, useState, type Dispatch } from 'react';
import {
  clamp,
  distance,
  findCornerHit,
  moveCorner,
  orderQuadPoints,
  pointInQuad,
  translateQuad,
  type Point,
  type ScreenElement,
} from '../../lib/visualLed';
import { fileToDataUrl, loadImage } from './imageLoader';
import { renderScene } from './canvasRenderer';
import { getScenePointer } from './pointer';
import { uid } from './state/initialState';
import type { Action } from './state/types';
import { useActiveScene, useVisualLed } from './state/VisualLedContext';

const MAX_CANVAS_W = 1600;
const MAX_CANVAS_H = 900;

/**
 * Canvas wrapper — subscribes to state, drives the imperative renderer,
 * and handles drag-drop uploads of background images. Pointer tool
 * interactions are added in phase 3b/c.
 */
const CanvasStage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const [cacheVersion, setCacheVersion] = useState(0);
  const scene = useActiveScene();
  const { state, dispatch } = useVisualLed();
  const [dropActive, setDropActive] = useState(false);

  // Preload the active background image; bump cacheVersion on load so
  // the render effect re-runs.
  useEffect(() => {
    const bg = scene.backgrounds.find((b) => b.id === scene.activeBackgroundId);
    if (!bg) return;
    if (imageCache.current.has(bg.src)) return;
    let cancelled = false;
    loadImage(bg.src)
      .then((img) => {
        if (cancelled) return;
        imageCache.current.set(bg.src, img);
        setCacheVersion((v) => v + 1);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [scene.activeBackgroundId, scene.backgrounds]);

  // Imperative draw on every relevant state change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== scene.canvasWidth) canvas.width = scene.canvasWidth;
    if (canvas.height !== scene.canvasHeight) canvas.height = scene.canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderScene(ctx, scene, state.tool, imageCache.current, {
      showCabinetGrid: state.ui.showCabinetGrid,
    });
  }, [scene, state.tool, state.ui.showCabinetGrid, cacheVersion]);

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDropActive(false);
      const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
        f.type.startsWith('image/'),
      );
      if (files.length === 0) return;
      await importBackgrounds(files, dispatch);
    },
    [dispatch],
  );

  const dragRef = useRef<
    | { type: 'corner'; id: string; corner: number }
    | { type: 'move'; id: string; last: Point }
    | { type: 'pan'; lastClientX: number; lastClientY: number }
    | null
  >(null);
  const spaceDownRef = useRef(false);

  const finishTool = useCallback(
    (finalPoint: Point) => {
      const tool = state.tool;
      if (!tool) return;

      if (tool.mode === 'scale2') {
        const [first] = tool.points;
        const pxLength = distance(first, finalPoint);
        const input = document.querySelector<HTMLInputElement>('input[data-length-input]');
        const real = Number(input?.value ?? '2');
        if (Number.isFinite(real) && real > 0 && pxLength > 1) {
          dispatch({
            type: 'scale/set',
            payload: { realLength: real, pxLength, pxPerMeter: pxLength / real },
          });
        }
        dispatch({ type: 'tool/cancel' });
        return;
      }

      if (tool.mode === 'place4') {
        const points = [...tool.points, finalPoint];
        const ordered = orderQuadPoints(points);
        const newScreen: ScreenElement = {
          id: uid('scr'),
          name: `Экран ${scene.elements.length + 1}`,
          corners: ordered,
          videoId: null,
          cabinetPlan: null,
        };
        dispatch({ type: 'screen/add', payload: newScreen });
        dispatch({ type: 'tool/cancel' });
      }
    },
    [dispatch, scene.elements.length, state.tool],
  );

  const onCanvasPointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Pan: right button, middle button, or Space+left.
      const isPanTrigger =
        event.button === 2 ||
        event.button === 1 ||
        (event.button === 0 && spaceDownRef.current);
      if (isPanTrigger) {
        event.preventDefault();
        canvas.setPointerCapture(event.pointerId);
        dragRef.current = {
          type: 'pan',
          lastClientX: event.clientX,
          lastClientY: event.clientY,
        };
        return;
      }

      if (event.button !== 0) return;
      const p = getScenePointer(canvas, event.clientX, event.clientY, scene.view);

      // Tool flow: push a point. On final click, compute + dispatch.
      if (state.tool) {
        const targetCount = state.tool.mode === 'scale2' ? 2 : 4;
        const nextCount = state.tool.points.length + 1;
        if (nextCount >= targetCount) {
          finishTool(p);
        } else {
          dispatch({ type: 'tool/pushPoint', payload: p });
        }
        return;
      }

      // No tool — try to select / drag.
      const selected = scene.elements.find((el) => el.id === scene.selectedElementId);
      if (selected) {
        const cornerIdx = findCornerHit(selected.corners, p, scene.view.scale, 10);
        if (cornerIdx >= 0) {
          canvas.setPointerCapture(event.pointerId);
          dragRef.current = { type: 'corner', id: selected.id, corner: cornerIdx };
          return;
        }
        if (pointInQuad(p, selected.corners)) {
          canvas.setPointerCapture(event.pointerId);
          dragRef.current = { type: 'move', id: selected.id, last: p };
          return;
        }
      }

      // Pick the topmost element under the pointer.
      let picked: ScreenElement | null = null;
      for (let i = scene.elements.length - 1; i >= 0; i -= 1) {
        if (pointInQuad(p, scene.elements[i].corners)) {
          picked = scene.elements[i];
          break;
        }
      }
      dispatch({
        type: 'screen/select',
        payload: { id: picked ? picked.id : null },
      });
      if (picked) {
        canvas.setPointerCapture(event.pointerId);
        dragRef.current = { type: 'move', id: picked.id, last: p };
      }
    },
    [dispatch, finishTool, scene.elements, scene.selectedElementId, scene.view, state.tool],
  );

  const onCanvasPointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (drag.type === 'pan') {
        const dx = event.clientX - drag.lastClientX;
        const dy = event.clientY - drag.lastClientY;
        // Translate client-pixel delta into canvas-pixel delta via the
        // same CSS ratio getScenePointer uses, so panning "follows the
        // mouse" even when the canvas is scaled to fit.
        const rect = canvas.getBoundingClientRect();
        const ratioX = canvas.width / rect.width;
        const ratioY = canvas.height / rect.height;
        dispatch({
          type: 'view/set',
          payload: {
            offsetX: scene.view.offsetX + dx * ratioX,
            offsetY: scene.view.offsetY + dy * ratioY,
          },
        });
        drag.lastClientX = event.clientX;
        drag.lastClientY = event.clientY;
        return;
      }

      const p = getScenePointer(canvas, event.clientX, event.clientY, scene.view);
      const el = scene.elements.find((it) => it.id === drag.id);
      if (!el) return;

      if (drag.type === 'corner') {
        dispatch({
          type: 'screen/updateCorners',
          payload: { id: drag.id, corners: moveCorner(el.corners, drag.corner, p) },
        });
        return;
      }
      if (drag.type === 'move') {
        const dx = p.x - drag.last.x;
        const dy = p.y - drag.last.y;
        dispatch({
          type: 'screen/updateCorners',
          payload: { id: drag.id, corners: translateQuad(el.corners, dx, dy) },
        });
        drag.last = p;
      }
    },
    [dispatch, scene.elements, scene.view],
  );

  // Wheel zoom — zoom-at-cursor, clamped to scene view min/max.
  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const canvasX = ((event.clientX - rect.left) * canvas.width) / rect.width;
      const canvasY = ((event.clientY - rect.top) * canvas.height) / rect.height;
      const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
      const prevScale = scene.view.scale;
      const nextScale = clamp(
        prevScale * factor,
        scene.view.minScale,
        scene.view.maxScale,
      );
      if (nextScale === prevScale) return;
      // Keep the scene point under the cursor stationary after zoom.
      const wx = (canvasX - scene.view.offsetX) / prevScale;
      const wy = (canvasY - scene.view.offsetY) / prevScale;
      dispatch({
        type: 'view/set',
        payload: {
          scale: nextScale,
          offsetX: canvasX - wx * nextScale,
          offsetY: canvasY - wy * nextScale,
        },
      });
    },
    [dispatch, scene.view],
  );

  const onCanvasPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Global keyboard: Delete / Backspace removes the selected element,
  // Space toggles the pan-on-left-drag modifier (LMB+Space = pan).
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
        dispatch({ type: 'screen/delete', payload: { id: scene.selectedElementId } });
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
      className={`relative flex min-h-[420px] flex-1 items-center justify-center overflow-hidden rounded-xl border bg-slate-950/40 p-3 transition-colors ${
        dropActive ? 'border-brand-400 bg-brand-500/5' : 'border-white/10'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDropActive(true);
      }}
      onDragLeave={() => setDropActive(false)}
      onDrop={onDrop}
    >
      <canvas
        ref={canvasRef}
        data-vled-canvas="true"
        width={scene.canvasWidth}
        height={scene.canvasHeight}
        className={`max-h-full max-w-full rounded-lg border border-white/5 shadow-xl ${
          state.tool ? 'cursor-crosshair' : 'cursor-default'
        }`}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
      {dropActive ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-brand-500/10 text-sm font-medium text-white">
          Отпусти, чтобы загрузить фон
        </div>
      ) : null}
    </div>
  );
};

/**
 * Reusable background-import flow so both the canvas drop zone and the
 * sidebar upload button share the same resize-to-fit + add-asset logic.
 */
export async function importBackgrounds(
  files: File[],
  dispatch: Dispatch<Action>,
): Promise<void> {
  for (const file of files) {
    try {
      const dataUrl = await fileToDataUrl(file);
      const img = await loadImage(dataUrl);

      // Fit the canvas to the image (capped), matching legacy setCanvasFromImage.
      const s = Math.min(
        MAX_CANVAS_W / img.naturalWidth,
        MAX_CANVAS_H / img.naturalHeight,
        1,
      );
      const w = Math.max(640, Math.round(img.naturalWidth * s));
      const h = Math.max(360, Math.round(img.naturalHeight * s));

      dispatch({
        type: 'background/add',
        payload: {
          id: uid('bg'),
          name: file.name,
          src: dataUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
        },
      });
      dispatch({ type: 'view/resizeCanvas', payload: { width: w, height: h } });
      dispatch({ type: 'view/reset' });
    } catch (err) {
      console.warn('Failed to import background', file.name, err);
    }
  }
}

export default CanvasStage;
