import { useEffect, useRef } from 'react';
import {
  DEMO_CANVAS_HEIGHT,
  DEMO_CANVAS_WIDTH,
  DEMO_DRAWERS,
  demoPhase,
} from './demoVideos';
import { useVisualLed } from './state/VisualLedContext';

/**
 * Hidden pool of media sources for the warped-video renderer.
 *
 * - Uploaded video assets: a <video> element keyed by data-video-id,
 *   muted + autoPlay + loop so it starts rolling automatically.
 * - Procedural demos (animationKind set): a <canvas> keyed by the
 *   same data-video-id. A single rAF loop redraws every demo canvas
 *   with the current phase. Loops are mathematically seamless so
 *   there's no seam stutter like the native <video loop> has.
 *
 * The canvas renderer looks up the element via querySelector and
 * passes it to drawWarpedSource — both <video> and <canvas> satisfy
 * CanvasImageSource.
 */
const VideoPool = () => {
  const { state } = useVisualLed();
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const demoVideos = state.videos.filter((v) => v.animationKind);
  const fileVideos = state.videos.filter((v) => !v.animationKind);

  // rAF loop for procedural demos. Only runs when there's at least
  // one demo asset AND at least one screen has any videoId assigned
  // (so we don't spin CPU if nothing's showing on screen). Skipped
  // entirely when the user has paused demos — last drawn frame stays.
  const hasAnyVideoAssignment = state.scenes.some((s) =>
    s.elements.some((el) => el.videoId),
  );
  const paused = state.ui.demosPaused;
  useEffect(() => {
    if (demoVideos.length === 0 || !hasAnyVideoAssignment || paused) return;
    let rafId = 0;
    const tick = () => {
      const t = demoPhase(performance.now());
      for (const video of demoVideos) {
        const canvas = canvasRefs.current.get(video.id);
        if (!canvas || !video.animationKind) continue;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        DEMO_DRAWERS[video.animationKind](ctx, t);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [demoVideos, hasAnyVideoAssignment, paused]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {fileVideos.map((v) => (
        <video
          key={v.id}
          data-video-id={v.id}
          src={v.src}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
        />
      ))}
      {demoVideos.map((v) => (
        <canvas
          key={v.id}
          data-video-id={v.id}
          ref={(el) => {
            if (el) canvasRefs.current.set(v.id, el);
            else canvasRefs.current.delete(v.id);
          }}
          width={DEMO_CANVAS_WIDTH}
          height={DEMO_CANVAS_HEIGHT}
        />
      ))}
    </div>
  );
};

export default VideoPool;
