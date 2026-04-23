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
 * grid before assigning it to a screen.
 */
const DemoThumbnail = ({ kind }: { kind: DemoAnimationKind }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const drawer = DEMO_DRAWERS[kind];
    let rafId = 0;
    const tick = () => {
      drawer(ctx, demoPhase(performance.now()));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [kind]);

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
