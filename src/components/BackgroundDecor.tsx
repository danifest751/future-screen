import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  BACKGROUND_CHANGED_EVENT,
  BACKGROUND_SETTINGS_CHANGED_EVENT,
  isCustomBackgroundId,
  type BackgroundId,
  type BackgroundSettingsById,
  type AuroraSettings,
  type MeshSettings,
  type DotsSettings,
  type WavesSettings,
  type RingsSettings,
  type NebulaSettings,
  type ColorBendsSettings,
  type PixelBlastSettings,
  type LineWavesSettings,
  type GalaxySettings,
  getStoredBackground,
  getStoredBackgroundSettingsMap,
} from '../lib/backgrounds';

const motionMultiplier = {
  slow: 1.5,
  normal: 1,
  fast: 0.7,
};

const ColorBendsDecor = ({ settings }: { settings: ColorBendsSettings }) => {
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
  const motionSpeed = motionMultiplier[motion] / Math.max(0.08, speed);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(${rotation}deg, ${color1}, ${color2}, ${color3})`,
          opacity: withAlpha(0.8, intensity),
          transform: `scale(${scale})`,
        }}
      />
      <div
        className="animate-float absolute -left-[12%] -top-[18%] h-[74%] w-[74%] rounded-full blur-[120px]"
        style={{
          background: `radial-gradient(circle, ${color1} 0%, transparent 70%)`,
          opacity: withAlpha(0.3 + warpStrength * 0.12, intensity),
          animationDuration: `${Math.max(2, 7 * motionSpeed)}s`,
          transform: `translate(${mouseInfluence * 2}px, ${parallax * 6}px) scale(${0.8 + frequency * 0.25})`,
        }}
      />
      <div
        className="animate-float-delayed absolute right-[-12%] top-[8%] h-[70%] w-[70%] rounded-full blur-[120px]"
        style={{
          background: `radial-gradient(circle, ${color2} 0%, transparent 70%)`,
          opacity: withAlpha(0.32 + warpStrength * 0.12, intensity),
          animationDuration: `${Math.max(2, 8.5 * motionSpeed)}s`,
          transform: `translate(${parallax * -8}px, ${mouseInfluence * 1.5}px) scale(${0.8 + frequency * 0.2})`,
        }}
      />
      <div
        className="animate-blob-pulse absolute bottom-[-16%] left-[18%] h-[64%] w-[64%] rounded-full blur-[110px]"
        style={{
          background: `radial-gradient(circle, ${color3} 0%, transparent 72%)`,
          opacity: withAlpha(0.28 + warpStrength * 0.14, intensity),
          animationDuration: `${Math.max(2, 6.2 * motionSpeed)}s`,
          transform: `rotate(${autoRotate * 24}deg) scale(${0.82 + frequency * 0.22})`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.32) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: `${Math.round(36 - Math.min(28, noise * 40))}px ${Math.round(36 - Math.min(28, noise * 40))}px, ${Math.round(18 - Math.min(14, noise * 24))}px ${Math.round(18 - Math.min(14, noise * 24))}px`,
          opacity: withAlpha(noise * 0.55, intensity),
        }}
      />
    </div>
  );
};

const PixelBlastDecor = ({ settings }: { settings: PixelBlastSettings }) => {
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
  const motionSpeed = motionMultiplier[motion];
  const cell = Math.max(6, Math.round(pixelSize * patternScale * 8));
  const dots = Math.max(1, Math.round(2 + patternDensity * 4));

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(160deg, rgba(8,10,20,0.98), ${color}22)`,
          opacity: withAlpha(1, intensity),
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${color}44 0 ${Math.max(1, dots)}px, transparent ${Math.max(1, dots)}px ${cell}px), repeating-linear-gradient(90deg, ${color}33 0 ${Math.max(1, dots)}px, transparent ${Math.max(1, dots)}px ${cell}px)`,
          opacity: withAlpha(0.24 + liquidStrength * 0.2, intensity),
          transform: `scale(${1 + pixelJitter * 0.06})`,
        }}
      />
      <div
        className="animate-pulse-slow absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color}88 0%, transparent ${Math.round(32 + liquidRadius * 16)}%)`,
          opacity: withAlpha(0.15 + rippleIntensity * 0.1, intensity),
          animationDuration: `${Math.max(1.2, (7 - rippleSpeed * 3) * motionSpeed)}s`,
          filter: `blur(${Math.round(26 + rippleThickness * 160)}px)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, transparent ${Math.round(36 + edgeFade * 20)}%, rgba(0,0,0,0.75) 100%)`,
          opacity: withAlpha(0.55, intensity),
        }}
      />
      <div
        className="animate-float absolute -left-20 top-1/4 h-[320px] w-[320px] rounded-full blur-[110px]"
        style={{
          background: color,
          opacity: withAlpha(0.12 + liquidStrength * 0.2, intensity),
          animationDuration: `${Math.max(2, wobbleSpeed * motionSpeed)}s`,
        }}
      />
    </div>
  );
};

const LineWavesDecor = ({ settings }: { settings: LineWavesSettings }) => {
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
  const motionSpeed = motionMultiplier[motion] / Math.max(0.08, speed);
  const lineCount = Math.max(8, Math.min(90, Math.round((innerLineCount + outerLineCount) / 2)));

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(150deg, rgba(5,10,24,0.95), rgba(12,18,38,0.95))',
          opacity: withAlpha(1, intensity),
        }}
      />
      <svg
        className="animate-float absolute inset-0 h-full w-full"
        style={{ opacity: withAlpha(0.28 + brightness * 0.42, intensity), animationDuration: `${Math.max(2, 8 * motionSpeed)}s`, transform: `rotate(${rotation}deg)` }}
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        {Array.from({ length: lineCount }).map((_, i) => {
          const y = (i / Math.max(1, lineCount - 1)) * 900;
          const amp = 10 + warpIntensity * 20 + (i % 5) * 2;
          const freq = 0.005 + colorCycleSpeed * 0.0015;
          const shift = i * 0.37 + mouseInfluence * 0.2;
          const c = i % 3 === 0 ? color1 : i % 3 === 1 ? color2 : color3;
          const d = `M0 ${y} C 240 ${y + Math.sin(shift) * amp}, 520 ${y - Math.cos(shift) * amp}, 760 ${y + Math.sin(shift * 1.2) * amp} C 1020 ${y - Math.sin(shift * 0.8) * amp}, 1220 ${y + Math.cos(shift * 1.1) * amp}, 1440 ${y + Math.sin(shift + freq * 400) * amp}`;
          return <path key={`${i}-${c}`} d={d} stroke={c} strokeOpacity={Math.max(0.06, 0.6 - i * 0.01)} strokeWidth={Math.max(0.5, 1.8 - i * 0.012)} fill="none" />;
        })}
      </svg>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, transparent ${Math.round(52 - edgeFadeWidth * 20)}%, rgba(0,0,0,0.7) 100%)`,
        }}
      />
    </div>
  );
};

const GalaxyDecor = ({ settings }: { settings: GalaxySettings }) => {
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
  const motionSpeed = motionMultiplier[motion] / Math.max(0.08, speed || 0.1);
  const starCount = Math.max(40, Math.min(260, Math.round(90 * density)));

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast}) hue-rotate(${hueShift}deg) saturate(${1 + saturation * 0.5})` }}>
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(7,13,34,0.95), rgba(2,5,14,1))',
          opacity: withAlpha(1, intensity),
        }}
      />
      <div
        className="animate-float absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${Math.round(focalX * 100)}% ${Math.round(focalY * 100)}%, rgba(130,180,255,${0.08 + glowIntensity * 0.28}), transparent 55%)`,
          animationDuration: `${Math.max(2, 10 * motionSpeed)}s`,
          transform: `translate(${rotationY * 30}px, ${rotationX * 30}px)`,
        }}
      />
      {Array.from({ length: starCount }).map((_, i) => {
        const xSeed = Math.abs(Math.sin((i + 1) * 12.9898 + rotationX * 3.1));
        const ySeed = Math.abs(Math.sin((i + 1) * 78.233 + rotationY * 4.7));
        const sSeed = Math.abs(Math.sin((i + 1) * 45.164 + starSpeed * 2));
        const left = Math.round(xSeed * 10000) / 100;
        const top = Math.round(ySeed * 10000) / 100;
        const size = Math.max(1, Math.min(4, 1 + sSeed * 3));
        const pulse = Math.max(2, 6 * motionSpeed / Math.max(0.25, twinkleIntensity + 0.1));
        return (
          <span
            key={`star-${i}`}
            className="animate-pulse-slow absolute rounded-full"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              background: 'rgba(230,240,255,0.9)',
              opacity: withAlpha(0.25 + sSeed * 0.6, intensity),
              boxShadow: `0 0 ${Math.round(4 + glowIntensity * 16)}px rgba(160,200,255,${0.2 + glowIntensity * 0.6})`,
              animationDuration: `${pulse + (i % 7) * 0.25 + starSpeed * 0.8}s`,
            }}
          />
        );
      })}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, transparent ${Math.round(42 + autoCenterRepulsion * 10)}%, rgba(0,0,0,0.75) 100%)`,
          opacity: withAlpha(0.45 + repulsionStrength * 0.06, intensity),
          transform: `rotate(${rotationSpeed * 30}deg)`,
        }}
      />
    </div>
  );
};

const withAlpha = (alpha: number, intensity: number) => Math.min(1, alpha * intensity);

const BackgroundDecor = () => {
  const { theme } = useTheme();
  const [background, setBackground] = useState<BackgroundId>('theme');
  const [settingsMap, setSettingsMap] = useState<BackgroundSettingsById>(() => getStoredBackgroundSettingsMap());

  useEffect(() => {
    const syncBackground = () => {
      setBackground(getStoredBackground());
    };

    const syncBackgroundSettings = () => {
      setSettingsMap(getStoredBackgroundSettingsMap());
    };

    syncBackground();
    syncBackgroundSettings();
    window.addEventListener('storage', syncBackground);
    window.addEventListener('storage', syncBackgroundSettings);
    window.addEventListener(BACKGROUND_CHANGED_EVENT, syncBackground as EventListener);
    window.addEventListener(BACKGROUND_SETTINGS_CHANGED_EVENT, syncBackgroundSettings as EventListener);

    return () => {
      window.removeEventListener('storage', syncBackground);
      window.removeEventListener('storage', syncBackgroundSettings);
      window.removeEventListener(BACKGROUND_CHANGED_EVENT, syncBackground as EventListener);
      window.removeEventListener(BACKGROUND_SETTINGS_CHANGED_EVENT, syncBackgroundSettings as EventListener);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-background', background);
    return () => {
      document.documentElement.setAttribute('data-background', 'theme');
    };
  }, [background]);

  if (isCustomBackgroundId(background)) {
    if (background === 'aurora') return <AuroraDecor settings={settingsMap.aurora} />;
    if (background === 'mesh') return <MeshDecor settings={settingsMap.mesh} />;
    if (background === 'dots') return <DotsDecor settings={settingsMap.dots} />;
    if (background === 'waves') return <WavesDecor settings={settingsMap.waves} />;
    if (background === 'rings') return <RingsDecor settings={settingsMap.rings} />;
    if (background === 'color-bends') return <ColorBendsDecor settings={settingsMap['color-bends']} />;
    if (background === 'pixel-blast') return <PixelBlastDecor settings={settingsMap['pixel-blast']} />;
    if (background === 'line-waves') return <LineWavesDecor settings={settingsMap['line-waves']} />;
    if (background === 'galaxy') return <GalaxyDecor settings={settingsMap.galaxy} />;
    return <NebulaDecor settings={settingsMap.nebula} />;
  }

  if (theme.id === 'light') return <LightDecor />;
  if (theme.id === 'neon') return <NeonDecor />;
  return <DefaultDecor />;
};

const DefaultDecor = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
    {/* Большой glow сверху-слева */}
    <div
      className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full opacity-30 blur-[120px]"
      style={{ background: 'var(--brand-500)' }}
    />
    {/* Малый glow справа */}
    <div
      className="absolute -right-20 top-1/4 h-[400px] w-[400px] rounded-full opacity-15 blur-[100px]"
      style={{ background: 'var(--brand-400)' }}
    />
    {/* Сетка */}
    <svg className="absolute inset-0 h-full w-full opacity-[0.03]">
      <defs>
        <pattern id="grid-default" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-default)" />
    </svg>
    {/* Горизонтальная линия-разделитель */}
    <div
      className="absolute left-0 right-0 top-[70vh] h-px opacity-20"
      style={{ background: 'linear-gradient(90deg, transparent, var(--brand-500), transparent)' }}
    />
  </div>
);

const LightDecor = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
    {/* Мягкий glow сверху */}
    <div
      className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full opacity-40 blur-[150px]"
      style={{ background: '#dbeafe' }}
    />
    <div
      className="absolute -right-10 top-1/3 h-[350px] w-[350px] rounded-full opacity-30 blur-[120px]"
      style={{ background: '#e0e7ff' }}
    />
    {/* Точечная сетка */}
    <svg className="absolute inset-0 h-full w-full opacity-[0.08]">
      <defs>
        <pattern id="dots-light" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#94a3b8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots-light)" />
    </svg>
    {/* Тонкая линия */}
    <div
      className="absolute left-0 right-0 top-[65vh] h-px opacity-15"
      style={{ background: 'linear-gradient(90deg, transparent, var(--brand-500), transparent)' }}
    />
  </div>
);

const NeonDecor = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
    {/* Зелёный glow сверху-слева */}
    <div
      className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-25 blur-[100px]"
      style={{ background: '#00ff88' }}
    />
    {/* Зелёный glow справа-снизу */}
    <div
      className="absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full opacity-15 blur-[100px]"
      style={{ background: '#00c853' }}
    />
    {/* Сканлайны */}
    <svg className="absolute inset-0 h-full w-full opacity-[0.04]">
      <defs>
        <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="4" y2="0" stroke="#00ff88" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#scanlines)" />
    </svg>
    {/* Неоновая горизонтальная линия */}
    <div
      className="absolute left-0 right-0 top-[60vh] h-px opacity-40"
      style={{ background: 'linear-gradient(90deg, transparent, #00ff88, transparent)' }}
    />
    <div
      className="absolute left-0 right-0 top-[60vh] h-px opacity-20 blur-sm"
      style={{ background: 'linear-gradient(90deg, transparent, #00ff88, transparent)' }}
    />
  </div>
);

const AuroraDecor = ({ settings }: { settings: AuroraSettings }) => {
  const { intensity, contrast, motion, color1, color2, color3, speed, blend, amplitude } = settings;
  const motionSpeed = motionMultiplier[motion] / Math.max(0.2, speed);
  const ampScale = Math.max(0.3, amplitude);
  return (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
    <div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(160deg, rgba(10,14,40,0.72), rgba(22,18,48,0.72))', opacity: withAlpha(0.92, intensity) }}
    />
    <div
      className="animate-float absolute -left-20 -top-20 h-[560px] w-[560px] rounded-full opacity-45 blur-[120px]"
      style={{
        background: `radial-gradient(circle, ${color1} 0%, transparent 70%)`,
        opacity: withAlpha(0.45 + blend * 0.2, intensity),
        animationDuration: `${6 * motionSpeed}s`,
        transform: `scale(${0.9 + ampScale * 0.14})`,
      }}
    />
    <div
      className="animate-float-delayed absolute right-[-120px] top-[15%] h-[520px] w-[520px] rounded-full opacity-40 blur-[120px]"
      style={{
        background: `radial-gradient(circle, ${color2} 0%, transparent 68%)`,
        opacity: withAlpha(0.4 + blend * 0.2, intensity),
        animationDuration: `${8 * motionSpeed}s`,
        transform: `scale(${0.88 + ampScale * 0.12})`,
      }}
    />
    <div
      className="animate-blob-pulse absolute bottom-[-140px] left-[20%] h-[460px] w-[460px] rounded-full opacity-35 blur-[100px]"
      style={{
        background: `radial-gradient(circle, ${color3} 0%, transparent 72%)`,
        opacity: withAlpha(0.35 + blend * 0.18, intensity),
        animationDuration: `${5 * motionSpeed}s`,
        transform: `scale(${0.92 + ampScale * 0.1})`,
      }}
    />
  </div>
  );
};

const MeshDecor = ({ settings }: { settings: MeshSettings }) => {
  const { intensity, contrast, motion, gridOpacity, glow } = settings;
  const motionSpeed = motionMultiplier[motion];
  return (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
    <div
      className="animate-pulse-slow absolute inset-0 opacity-80"
      style={{
        background:
          'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.3), transparent 35%), radial-gradient(circle at 80% 15%, rgba(34,211,238,0.24), transparent 30%), radial-gradient(circle at 70% 80%, rgba(236,72,153,0.2), transparent 35%), linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.92))',
        opacity: withAlpha(0.8 + glow * 0.2, intensity),
        animationDuration: `${4 * motionSpeed}s`,
      }}
    />
    <svg className="absolute inset-0 h-full w-full" style={{ opacity: withAlpha(gridOpacity, intensity) }}>
      <defs>
        <pattern id="mesh-grid" width="52" height="52" patternUnits="userSpaceOnUse">
          <path d="M 52 0 L 0 0 0 52" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mesh-grid)" />
    </svg>
    <div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(148,163,184,0.35), transparent 55%)',
        opacity: withAlpha(glow * 0.25, intensity),
      }}
    />
  </div>
  );
};

const DotsDecor = ({ settings }: { settings: DotsSettings }) => {
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
  const motionSpeed = motionMultiplier[motion];
  const pulseDuration = (Math.max(0.2, speedTrigger / 100) * motionSpeed).toFixed(2);
  const dotsOpacity = Math.min(0.55, (maxSpeed / 10000) * 0.4 + 0.12);
  const shimmer = Math.max(0.05, 1 - resistance / 2500);
  return (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(circle at 20% 20%, ${baseColor}33, transparent 42%), linear-gradient(145deg, rgba(2,6,23,0.98), rgba(15,23,42,0.98))`,
        opacity: withAlpha(1, intensity),
      }}
    />
    <svg className="animate-pulse-slow absolute inset-0 h-full w-full" style={{ opacity: withAlpha(dotsOpacity, intensity), animationDuration: `${pulseDuration}s` }}>
      <defs>
        <pattern id="dots-grid" width={gap} height={gap} patternUnits="userSpaceOnUse">
          <circle cx={Math.max(2, gap * 0.25)} cy={Math.max(2, gap * 0.25)} r={dotSize} fill={baseColor} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots-grid)" />
    </svg>
    <div
      className="absolute left-0 right-0 top-1/3 h-px opacity-30"
      style={{
        background: `linear-gradient(90deg, transparent, ${activeColor}, transparent)`,
        opacity: withAlpha(Math.min(0.75, 0.2 + shockStrength * 0.06), intensity),
        boxShadow: `0 0 ${Math.round(shockRadius * 0.25)}px ${activeColor}`,
      }}
    />
    <div
      className="animate-pulse-slow absolute rounded-full blur-[80px]"
      style={{
        left: `calc(50% - ${Math.round(proximity / 2)}px)`,
        top: `calc(50% - ${Math.round(proximity / 2)}px)`,
        width: proximity,
        height: proximity,
        background: activeColor,
        opacity: withAlpha(0.06 + shimmer * 0.2, intensity),
        animationDuration: `${Math.max(0.2, returnDuration) * motionSpeed}s`,
      }}
    />
  </div>
  );
};

const WavesDecor = ({ settings }: { settings: WavesSettings }) => {
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
  const motionSpeed = motionMultiplier[motion];
  const lineCount = Math.max(6, Math.min(24, Math.round(420 / yGap)));
  const width = 1440;
  const height = 900;
  const step = Math.max(14, xGap * 5);

  const makePath = (idx: number, phase: number) => {
    const baseY = 120 + idx * yGap * 1.25;
    let d = `M0 ${baseY}`;
    for (let x = step; x <= width; x += step) {
      const offsetA = Math.sin(x * waveSpeedX + phase + idx * tension * 30) * waveAmpY;
      const offsetB = Math.cos(x * waveSpeedY * 0.9 + phase * 0.8 + idx * 0.35) * (waveAmpX * 0.22);
      const drift = Math.sin((idx + 1) * 0.6 + phase * friction) * (maxCursorMove * 0.08);
      d += ` L${x} ${baseY + offsetA + offsetB + drift}`;
    }
    return d;
  };

  const phaseA = (waveSpeedX * 120) / motionSpeed;
  const phaseB = (waveSpeedY * 140) / motionSpeed;

  return (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
    <div
      className="absolute inset-0"
      style={{ background: `linear-gradient(160deg, ${backgroundColor}, rgba(10,10,26,0.98))`, opacity: withAlpha(1, intensity) }}
    />
    <svg className="animate-float absolute inset-0 h-full w-full" style={{ opacity: withAlpha(0.42, intensity), animationDuration: `${Math.max(2, 9 * motionSpeed / (waveSpeedX * 100))}s` }} viewBox="0 0 1440 900" preserveAspectRatio="none">
      {Array.from({ length: lineCount }).map((_, idx) => (
        <path
          key={`wave-a-${idx}`}
          d={makePath(idx, phaseA)}
          stroke={lineColor}
          strokeWidth={Math.max(0.6, 2 - idx * 0.04 + tension * 35)}
          strokeOpacity={Math.max(0.08, 0.6 - idx * 0.02)}
          fill="none"
        />
      ))}
      {Array.from({ length: Math.max(4, Math.floor(lineCount / 2)) }).map((_, idx) => (
        <path
          key={`wave-b-${idx}`}
          d={makePath(idx + 1, phaseB)}
          stroke={lineColor}
          strokeWidth={Math.max(0.5, 1.4 - idx * 0.03)}
          strokeOpacity={Math.max(0.05, 0.28 - idx * 0.02)}
          fill="none"
        />
      ))}
    </svg>
    <div
      className="absolute -left-28 top-1/4 h-[380px] w-[380px] rounded-full opacity-20 blur-[100px]"
      style={{ background: lineColor, opacity: withAlpha(0.14 + tension * 8, intensity) }}
    />
    <div
      className="absolute -right-24 bottom-1/4 h-[340px] w-[340px] rounded-full opacity-20 blur-[90px]"
      style={{ background: lineColor, opacity: withAlpha(0.08 + (1 - friction) * 0.9, intensity) }}
    />
  </div>
  );
};

const RingsDecor = ({ settings }: { settings: RingsSettings }) => {
  const { intensity, contrast, motion, rings, spread } = settings;
  const motionSpeed = motionMultiplier[motion];
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(15,23,42,0.95), rgba(2,6,23,0.98))',
          opacity: withAlpha(1, intensity),
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: rings }).map((_, idx) => {
          const size = 180 + idx * 90 * spread;
          return (
            <div
              key={size}
              className="animate-pulse-slow absolute rounded-full border"
              style={{
                width: size,
                height: size,
                borderColor: `rgba(96,165,250,${withAlpha(0.34 - idx * 0.03, intensity)})`,
                animationDuration: `${(3.2 + idx * 0.35) * motionSpeed}s`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const NebulaDecor = ({ settings }: { settings: NebulaSettings }) => {
  const { intensity, contrast, motion, grain, hueShift } = settings;
  const motionSpeed = motionMultiplier[motion];
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast}) hue-rotate(${hueShift}deg)` }}>
      <div
        className="animate-float absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 30%, rgba(168,85,247,0.35), transparent 45%), radial-gradient(circle at 70% 20%, rgba(14,165,233,0.3), transparent 42%), radial-gradient(circle at 65% 70%, rgba(236,72,153,0.3), transparent 48%), linear-gradient(145deg, rgba(3,7,18,0.96), rgba(17,24,39,0.96))',
          opacity: withAlpha(1, intensity),
          animationDuration: `${7.5 * motionSpeed}s`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(148,163,184,0.4) 1px, transparent 1px)',
          backgroundSize: `${Math.round(14 + grain * 40)}px ${Math.round(14 + grain * 40)}px`,
          opacity: withAlpha(grain, intensity),
        }}
      />
    </div>
  );
};

export default BackgroundDecor;
