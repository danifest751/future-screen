import { lazy, Suspense, type ComponentType } from 'react';
import type {
  ColorBendsSettings, PixelBlastSettings, LineWavesSettings, GalaxySettings,
  AuroraSettings, MeshSettings, DotsSettings, WavesSettings, RingsSettings, NebulaSettings
} from '../../lib/backgrounds';

// Lazy load heavy ReactBits components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactBitsColorBends = lazy(() => import('./reactbits/ColorBends.jsx')) as ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactBitsPixelBlast = lazy(() => import('./reactbits/PixelBlast.jsx')) as ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactBitsLineWaves = lazy(() => import('./reactbits/LineWaves.jsx')) as ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactBitsGalaxy = lazy(() => import('./reactbits/Galaxy.jsx')) as ComponentType<any>;
// New ReactBits components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactBitsAurora = lazy(() => import('./reactbits/Aurora.jsx')) as ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactBitsMesh = lazy(() => import('./reactbits/Mesh.jsx')) as ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactBitsDots = lazy(() => import('./reactbits/Dots.jsx')) as ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactBitsWaves = lazy(() => import('./reactbits/Waves.jsx')) as ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactBitsRings = lazy(() => import('./reactbits/Rings.jsx')) as ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactBitsNebula = lazy(() => import('./reactbits/Nebula.jsx')) as ComponentType<any>;

const withAlpha = (alpha: number, intensity: number) => Math.min(1, alpha * intensity);

const motionMultiplier = {
  slow: 1.5,
  normal: 1,
  fast: 0.7,
};

// Loading placeholder for heavy backgrounds
const BackgroundPlaceholder = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
    <div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(circle at 20% 20%, rgba(102, 126, 234, 0.1), transparent 40%)',
      }}
    />
  </div>
);

export const ColorBendsDecorLazy = ({ settings }: { settings: ColorBendsSettings }) => {
  const {
    intensity,
    contrast,
    motion,
    color1,
    color2,
    color3,
    speed,
    rotation,
    autoRotate,
    scale,
    frequency,
    warpStrength,
    mouseInfluence,
    parallax,
    noise,
  } = settings;

  return (
    <Suspense fallback={<BackgroundPlaceholder />}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
        <ReactBitsColorBends
          className="h-full w-full"
          style={{ opacity: withAlpha(1, intensity) }}
          rotation={rotation}
          speed={Math.max(0.01, speed / motionMultiplier[motion])}
          colors={[color1, color2, color3]}
          transparent
          autoRotate={autoRotate}
          scale={scale}
          frequency={frequency}
          warpStrength={warpStrength}
          mouseInfluence={mouseInfluence}
          parallax={parallax}
          noise={noise}
        />
      </div>
    </Suspense>
  );
};

export const PixelBlastDecorLazy = ({ settings }: { settings: PixelBlastSettings }) => {
  const {
    intensity,
    contrast,
    motion,
    color,
    pixelSize,
    patternScale,
    patternDensity,
    pixelJitter,
    rippleIntensity,
    rippleThickness,
    rippleSpeed,
    edgeFade,
    liquidStrength,
    liquidRadius,
    wobbleSpeed,
  } = settings;

  return (
    <Suspense fallback={<BackgroundPlaceholder />}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
        <ReactBitsPixelBlast
          className="h-full w-full"
          style={{ opacity: withAlpha(1, intensity) }}
          color={color}
          pixelSize={pixelSize}
          patternScale={patternScale}
          patternDensity={patternDensity}
          liquid
          liquidStrength={liquidStrength}
          liquidRadius={liquidRadius}
          pixelSizeJitter={pixelJitter}
          enableRipples
          rippleIntensityScale={rippleIntensity}
          rippleThickness={rippleThickness}
          rippleSpeed={rippleSpeed}
          liquidWobbleSpeed={wobbleSpeed}
          speed={Math.max(0.01, 0.5 / motionMultiplier[motion])}
          edgeFade={edgeFade}
          transparent
        />
      </div>
    </Suspense>
  );
};

export const LineWavesDecorLazy = ({ settings }: { settings: LineWavesSettings }) => {
  const {
    intensity,
    contrast,
    motion,
    color1,
    color2,
    color3,
    speed,
    innerLineCount,
    outerLineCount,
    warpIntensity,
    rotation,
    edgeFadeWidth,
    colorCycleSpeed,
    brightness,
    mouseInfluence,
  } = settings;

  return (
    <Suspense fallback={<BackgroundPlaceholder />}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(150deg, rgba(5,10,24,0.96), rgba(12,18,38,0.96))',
            opacity: withAlpha(1, intensity),
          }}
        />
        <ReactBitsLineWaves
          speed={Math.max(0.01, speed / motionMultiplier[motion])}
          innerLineCount={innerLineCount}
          outerLineCount={outerLineCount}
          warpIntensity={warpIntensity}
          rotation={rotation}
          edgeFadeWidth={edgeFadeWidth}
          colorCycleSpeed={colorCycleSpeed}
          brightness={brightness}
          color1={color1}
          color2={color2}
          color3={color3}
          enableMouseInteraction
          mouseInfluence={mouseInfluence}
        />
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 50%, transparent ${Math.round(58 - edgeFadeWidth * 28)}%, rgba(0,0,0,0.78) 100%)` }}
        />
      </div>
    </Suspense>
  );
};

export const GalaxyDecorLazy = ({ settings }: { settings: GalaxySettings }) => {
  const {
    intensity,
    contrast,
    motion,
    focalX,
    focalY,
    rotationX,
    rotationY,
    starSpeed,
    density,
    hueShift,
    speed,
    glowIntensity,
    saturation,
    repulsionStrength,
    twinkleIntensity,
    rotationSpeed,
    autoCenterRepulsion,
  } = settings;

  return (
    <Suspense fallback={<BackgroundPlaceholder />}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast}) hue-rotate(${hueShift}deg) saturate(${1 + saturation * 0.65})` }}>
        <ReactBitsGalaxy
          focal={[focalX, focalY]}
          rotation={[rotationX, rotationY]}
          starSpeed={starSpeed}
          density={density}
          hueShift={hueShift}
          speed={Math.max(0.01, speed / motionMultiplier[motion])}
          mouseInteraction
          glowIntensity={glowIntensity}
          saturation={saturation}
          mouseRepulsion
          repulsionStrength={repulsionStrength}
          twinkleIntensity={twinkleIntensity}
          rotationSpeed={rotationSpeed}
          autoCenterRepulsion={autoCenterRepulsion}
          transparent
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${Math.round(focalX * 100)}% ${Math.round(focalY * 100)}%, rgba(120,175,255,${0.08 + glowIntensity * 0.35}), transparent 54%)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, transparent ${Math.round(40 + autoCenterRepulsion * 12)}%, rgba(0,0,0,0.78) 100%)`,
            transform: `rotate(${rotationSpeed * 42}deg)`,
            opacity: withAlpha(0.48 + repulsionStrength * 0.05, intensity),
          }}
        />
      </div>
    </Suspense>
  );
};

// New ReactBits lazy exports
export const AuroraDecorLazy = ({ settings }: { settings: AuroraSettings }) => {
  const {
    intensity,
    contrast,
    motion,
    color1,
    color2,
    color3,
    speed,
    blend,
    amplitude,
  } = settings;

  return (
    <Suspense fallback={<BackgroundPlaceholder />}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
        <ReactBitsAurora
          className="h-full w-full"
          style={{ opacity: withAlpha(1, intensity) }}
          color1={color1}
          color2={color2}
          color3={color3}
          speed={Math.max(0.01, speed / motionMultiplier[motion])}
          amplitude={amplitude}
          blend={blend}
          mouseInteraction
          transparent
        />
      </div>
    </Suspense>
  );
};

export const MeshDecorLazy = ({ settings }: { settings: MeshSettings }) => {
  const {
    intensity,
    contrast,
    motion,
    gridOpacity,
    glow,
  } = settings;

  return (
    <Suspense fallback={<BackgroundPlaceholder />}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
        <ReactBitsMesh
          className="h-full w-full"
          style={{ opacity: withAlpha(1, intensity) }}
          gridOpacity={gridOpacity}
          glow={glow}
          speed={1 / motionMultiplier[motion]}
          mouseInteraction
          transparent
        />
      </div>
    </Suspense>
  );
};

export const DotsDecorLazy = ({ settings }: { settings: DotsSettings }) => {
  const {
    intensity,
    contrast,
    motion,
    dotSize,
    gap,
    baseColor,
    activeColor,
    proximity,
    speedTrigger,
    shockRadius,
    shockStrength,
    maxSpeed,
    resistance,
    returnDuration,
  } = settings;

  return (
    <Suspense fallback={<BackgroundPlaceholder />}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
        <ReactBitsDots
          className="h-full w-full"
          style={{ opacity: withAlpha(1, intensity) }}
          dotSize={dotSize}
          gap={gap}
          baseColor={baseColor}
          activeColor={activeColor}
          proximity={proximity}
          speedTrigger={speedTrigger}
          shockRadius={shockRadius}
          shockStrength={shockStrength}
          maxSpeed={maxSpeed}
          resistance={resistance}
          returnDuration={returnDuration * motionMultiplier[motion]}
          mouseInteraction
          transparent
        />
      </div>
    </Suspense>
  );
};

export const WavesDecorLazy = ({ settings }: { settings: WavesSettings }) => {
  const {
    intensity,
    contrast,
    motion,
    lineColor,
    backgroundColor,
    waveSpeedX,
    waveSpeedY,
    waveAmpX,
    waveAmpY,
    xGap,
    yGap,
    friction,
    tension,
    maxCursorMove,
  } = settings;

  return (
    <Suspense fallback={<BackgroundPlaceholder />}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
        <ReactBitsWaves
          className="h-full w-full"
          style={{ opacity: withAlpha(1, intensity) }}
          lineColor={lineColor}
          backgroundColor={backgroundColor}
          waveSpeedX={waveSpeedX * motionMultiplier[motion]}
          waveSpeedY={waveSpeedY * motionMultiplier[motion]}
          waveAmpX={waveAmpX}
          waveAmpY={waveAmpY}
          xGap={xGap}
          yGap={yGap}
          friction={friction}
          tension={tension}
          maxCursorMove={maxCursorMove}
          mouseInteraction
          transparent
        />
      </div>
    </Suspense>
  );
};

export const RingsDecorLazy = ({ settings }: { settings: RingsSettings }) => {
  const {
    intensity,
    contrast,
    motion,
    rings,
    spread,
  } = settings;

  return (
    <Suspense fallback={<BackgroundPlaceholder />}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
        <ReactBitsRings
          className="h-full w-full"
          style={{ opacity: withAlpha(1, intensity) }}
          rings={rings}
          spread={spread}
          speed={1 / motionMultiplier[motion]}
          mouseInteraction
          transparent
        />
      </div>
    </Suspense>
  );
};

export const NebulaDecorLazy = ({ settings }: { settings: NebulaSettings }) => {
  const {
    intensity,
    contrast,
    motion,
    grain,
    hueShift,
  } = settings;

  return (
    <Suspense fallback={<BackgroundPlaceholder />}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
        <ReactBitsNebula
          className="h-full w-full"
          style={{ opacity: withAlpha(1, intensity) }}
          grain={grain}
          hueShift={hueShift}
          speed={1 / motionMultiplier[motion]}
          mouseInteraction
          transparent
        />
      </div>
    </Suspense>
  );
};
