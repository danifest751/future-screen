import { useCallback, useEffect, useRef, useState, type Dispatch } from 'react';
import {
  autoFillCabinets,
  clamp,
  distance,
  findCornerHit,
  findEdgeHit,
  getElementSizeMeters,
  moveCorner,
  orderQuadPoints,
  pointInQuad,
  resizeQuadEdge,
  translateQuad,
  type Point,
  type ScreenElement,
} from '../../lib/visualLed';
import { fileToDataUrl, loadImage } from './imageLoader';
import { renderScene } from './canvasRenderer';
import { getScenePointer } from './pointer';
import QuickAddToolbar from './QuickAddToolbar';
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
  // Latches to true after any touch pointerdown, back to false on a
  // mouse pointerdown. Drives larger corner handles + a forgiving hit
  // radius so a finger can land on them.
  const [touchMode, setTouchMode] = useState(false);
  // Forces the cabinet grid on while the user is interacting with a
  // screen (corner/edge resize or move). Restored to whatever the
  // showCabinetGrid checkbox said as soon as the drag releases.
  const [interactingScreen, setInteractingScreen] = useState(false);

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
      showCabinetGrid: state.ui.showCabinetGrid || interactingScreen,
      touchMode,
      freeTransform: state.ui.freeTransform,
    });
  }, [
    scene,
    state.tool,
    state.ui.showCabinetGrid,
    state.ui.freeTransform,
    interactingScreen,
    cacheVersion,
    touchMode,
  ]);

  // When at least one screen has a video assigned, run a rAF loop so
  // the canvas redraws at ~60fps and the video frames stay in sync.
  // Idle (no videos) means no loop, zero CPU overhead.
  const hasPlayingVideo = scene.elements.some((el) => el.videoId);
  useEffect(() => {
    if (!hasPlayingVideo) return;
    let rafId = 0;
    const tick = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderScene(ctx, scene, state.tool, imageCache.current, {
            showCabinetGrid: state.ui.showCabinetGrid || interactingScreen,
            touchMode,
            freeTransform: state.ui.freeTransform,
          });
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    hasPlayingVideo,
    scene,
    state.tool,
    state.ui.showCabinetGrid,
    state.ui.freeTransform,
    interactingScreen,
    touchMode,
  ]);

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
    | { type: 'edge'; id: string; edge: number; last: Point }
    | { type: 'move'; id: string; last: Point }
    | { type: 'pan'; lastClientX: number; lastClientY: number }
    | null
  >(null);
  const spaceDownRef = useRef(false);

  // Multi-touch pinch-zoom support. Tracks every active pointer so we
  // can detect when the user puts a second finger on the canvas. While
  // pinch is active we also pan with the midpoint, so two-finger drag
  // works without a separate gesture.
  const activePointersRef = useRef<Map<number, { clientX: number; clientY: number }>>(
    new Map(),
  );
  const pinchRef = useRef<{
    startDist: number;
    startScale: number;
    worldX: number;
    worldY: number;
  } | null>(null);

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

  const pointerDistance = (
    a: { clientX: number; clientY: number },
    b: { clientX: number; clientY: number },
  ) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

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

      // Track every pointer so we can detect 2-finger pinch on touch.
      activePointersRef.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      // Latch touch-mode based on the input device. Pen counts as touch
      // here because it has the same precision concerns (no hover, no
      // sub-pixel control via wheel).
      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        setTouchMode(true);
      } else if (event.pointerType === 'mouse') {
        setTouchMode(false);
      }

      // Two fingers on touch — enter pinch-zoom mode and cancel any
      // single-finger drag in progress. Pinch implicitly handles pan
      // via the midpoint, so we don't need a separate two-finger pan.
      if (
        event.pointerType === 'touch' &&
        activePointersRef.current.size === 2
      ) {
        const [a, b] = Array.from(activePointersRef.current.values());
        const startDist = pointerDistance(a, b);
        const mid = canvasMidpoint(a, b);
        if (mid && startDist > 0) {
          dragRef.current = null;
          pinchRef.current = {
            startDist,
            startScale: scene.view.scale,
            worldX: (mid.x - scene.view.offsetX) / scene.view.scale,
            worldY: (mid.y - scene.view.offsetY) / scene.view.scale,
          };
        }
        return;
      }

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
        // Corner drag — perspective distortion. Locked behind freeTransform
        // so a casual user resizing a screen doesn't accidentally skew it.
        if (state.ui.freeTransform) {
          const cornerIdx = findCornerHit(
            selected.corners,
            p,
            scene.view.scale,
            touchMode ? 16 : 10,
          );
          if (cornerIdx >= 0) {
            canvas.setPointerCapture(event.pointerId);
            dragRef.current = { type: 'corner', id: selected.id, corner: cornerIdx };
            setInteractingScreen(true);
            return;
          }
        }
        // Edge drag — window-style rectangular resize, available in any mode.
        const edgeIdx = findEdgeHit(
          selected.corners,
          p,
          scene.view.scale,
          touchMode ? 14 : 8,
        );
        if (edgeIdx >= 0) {
          canvas.setPointerCapture(event.pointerId);
          dragRef.current = { type: 'edge', id: selected.id, edge: edgeIdx, last: p };
          setInteractingScreen(true);
          return;
        }
        if (pointInQuad(p, selected.corners)) {
          canvas.setPointerCapture(event.pointerId);
          dragRef.current = { type: 'move', id: selected.id, last: p };
          setInteractingScreen(true);
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
        setInteractingScreen(true);
      }
    },
    [
      dispatch,
      finishTool,
      scene.elements,
      scene.selectedElementId,
      scene.view,
      state.tool,
      state.ui.freeTransform,
      touchMode,
    ],
  );

  const onCanvasPointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      // Update the tracked pointer position regardless of mode.
      if (activePointersRef.current.has(event.pointerId)) {
        activePointersRef.current.set(event.pointerId, {
          clientX: event.clientX,
          clientY: event.clientY,
        });
      }

      // Pinch-zoom: scale around the midpoint between the two fingers
      // and pan by following the midpoint, all in one dispatch.
      if (pinchRef.current && activePointersRef.current.size === 2) {
        const [a, b] = Array.from(activePointersRef.current.values());
        const newDist = pointerDistance(a, b);
        const mid = canvasMidpoint(a, b);
        if (!mid || newDist <= 0) return;
        const ratio = newDist / pinchRef.current.startDist;
        const nextScale = clamp(
          pinchRef.current.startScale * ratio,
          scene.view.minScale,
          scene.view.maxScale,
        );
        dispatch({
          type: 'view/set',
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

      // Live cabinet auto-fill helper: shared by corner and edge drags.
      // Skipped for pure translate (move), where size is unchanged.
      const fitCabinetsTo = (newCorners: typeof el.corners) => {
        if (!el.cabinetPlan || !scene.scaleCalib) return;
        const newSize = getElementSizeMeters(newCorners, scene.scaleCalib);
        if (!newSize) return;
        const fitted = autoFillCabinets(newSize, el.cabinetPlan.pitch);
        if (fitted.cols !== el.cabinetPlan.cols || fitted.rows !== el.cabinetPlan.rows) {
          dispatch({
            type: 'screen/update',
            payload: { id: drag.id, patch: { cabinetPlan: fitted } },
          });
        }
      };

      if (drag.type === 'corner') {
        const newCorners = moveCorner(el.corners, drag.corner, p);
        dispatch({
          type: 'screen/updateCorners',
          payload: { id: drag.id, corners: newCorners },
        });
        fitCabinetsTo(newCorners);
        return;
      }

      if (drag.type === 'edge') {
        // Pointer delta in scene space = current p minus last recorded p.
        const dx = p.x - drag.last.x;
        const dy = p.y - drag.last.y;
        const newCorners = resizeQuadEdge(el.corners, drag.edge, dx, dy);
        dispatch({
          type: 'screen/updateCorners',
          payload: { id: drag.id, corners: newCorners },
        });
        fitCabinetsTo(newCorners);
        // Track new pointer position so the next move sample uses an
        // up-to-date reference point even though the corners shifted.
        drag.last = p;
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
    [dispatch, scene.elements, scene.scaleCalib, scene.view],
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

  const onCanvasPointerUp = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      activePointersRef.current.delete(event.pointerId);
      // Drop pinch state once we have <2 active pointers. Single-finger
      // drag is NOT auto-resumed — the user has to lift and re-tap so
      // we don't surprise them with a screen jumping.
      if (activePointersRef.current.size < 2) {
        pinchRef.current = null;
      }
      if (activePointersRef.current.size === 0) {
        dragRef.current = null;
        // Restore the user's "Показывать сетку" setting now that the
        // drag is over.
        setInteractingScreen(false);
      }
    },
    [],
  );

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
        className={`max-h-full max-w-full touch-none rounded-lg border border-white/5 shadow-xl ${
          state.tool ? 'cursor-crosshair' : 'cursor-default'
        }`}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onPointerCancel={onCanvasPointerUp}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
      {dropActive ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-brand-500/10 text-sm font-medium text-white">
          Отпусти, чтобы загрузить фон
        </div>
      ) : null}
      <QuickAddToolbar />
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

      const bgId = uid('bg');
      dispatch({
        type: 'background/add',
        payload: {
          id: bgId,
          name: file.name,
          src: dataUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
          uploadStatus: 'uploading',
        },
      });
      dispatch({ type: 'view/resizeCanvas', payload: { width: w, height: h } });
      dispatch({ type: 'view/reset' });

      // Background upload to Supabase Storage — gives us storagePath so
      // saveProject can persist the bg without hitting the 512 KB cap.
      // Local data URL still works until the upload resolves.
      void uploadBackground(file, dataUrl, bgId, dispatch);
    } catch (err) {
      console.warn('Failed to import background', file.name, err);
    }
  }
}

async function uploadBackground(
  file: File,
  dataUrl: string,
  bgId: string,
  dispatch: Dispatch<Action>,
): Promise<void> {
  try {
    const response = await fetch('/api/visual-led/upload-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_name: file.name,
        mime_type: file.type || 'image/jpeg',
        data_url: dataUrl,
      }),
    });
    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const detail = await response.json();
        if (detail?.error) message = detail.error;
      } catch {
        // ignore
      }
      dispatch({
        type: 'background/update',
        payload: { id: bgId, patch: { uploadStatus: 'failed', uploadError: message } },
      });
      return;
    }
    const data = await response.json();
    dispatch({
      type: 'background/update',
      payload: {
        id: bgId,
        patch: {
          storagePath: data.storage_path,
          storageBucket: data.storage_bucket,
          uploadStatus: 'uploaded',
          uploadError: null,
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'upload failed';
    dispatch({
      type: 'background/update',
      payload: { id: bgId, patch: { uploadStatus: 'failed', uploadError: message } },
    });
  }
}

export default CanvasStage;
