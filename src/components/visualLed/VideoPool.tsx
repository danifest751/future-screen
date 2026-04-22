import { useVisualLed } from './state/VisualLedContext';

/**
 * Hidden pool of <video> elements — one per VideoAsset in state. The
 * canvas renderer looks these up by `data-video-id` to draw their
 * current frame onto screen quads via drawWarpedSource.
 *
 * Kept muted + autoPlay + loop so videos start rolling as soon as
 * they're added (no user click required, matches legacy behaviour).
 */
const VideoPool = () => {
  const { state } = useVisualLed();
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
      {state.videos.map((v) => (
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
    </div>
  );
};

export default VideoPool;
