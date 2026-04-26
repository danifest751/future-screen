import { useEffect, useRef } from 'react';
import {
  DEMO_CANVAS_HEIGHT,
  DEMO_CANVAS_WIDTH,
  DEMO_DRAWERS,
  demoPhase,
  type DemoAnimationKind,
} from './demoVideos';

/**
 * Live preview for a procedural demo asset — runs its own rAF loop on
 * a small canvas so the user can see the animation in the library
 * grid before assigning it to a screen. When `paused` is true the rAF
 * loop is skipped and the last drawn frame remains visible (we render
 * one final frame at the current phase before stopping so a freshly
 * mounted thumbnail doesn't show a black square in the paused state).
 */
const DemoThumbnail = ({
  kind,
  paused = false,
}: {
  kind: DemoAnimationKind;
  paused?: boolean;
}) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const drawer = DEMO_DRAWERS[kind];
    if (paused) {
      drawer(ctx, demoPhase(performance.now()));
      return;
    }
    let rafId = 0;
    const tick = () => {
      drawer(ctx, demoPhase(performance.now()));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [kind, paused]);

  return (
    <canvas
      ref={ref}
      width={DEMO_CANVAS_WIDTH}
      height={DEMO_CANVAS_HEIGHT}
      className="block aspect-video w-full object-cover"
    />
  );
};

export default DemoThumbnail;
