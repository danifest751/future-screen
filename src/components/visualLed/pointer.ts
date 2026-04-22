import type { Point, ViewTransform } from '../../lib/visualLed';

/**
 * Convert a pointer event's client coordinates to scene coordinates,
 * accounting for the canvas element's CSS-to-pixel ratio and the
 * current view (pan/zoom) transform. Matches the legacy `getPointer`.
 */
export function getScenePointer(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  view: ViewTransform,
): Point {
  const rect = canvas.getBoundingClientRect();
  const sx = ((clientX - rect.left) * canvas.width) / rect.width;
  const sy = ((clientY - rect.top) * canvas.height) / rect.height;
  return {
    x: (sx - view.offsetX) / view.scale,
    y: (sy - view.offsetY) / view.scale,
  };
}
