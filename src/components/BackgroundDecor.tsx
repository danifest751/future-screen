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
  getStoredBackground,
  getStoredBackgroundSettingsMap,
} from '../lib/backgrounds';

const motionMultiplier = {
  slow: 1.5,
  normal: 1,
  fast: 0.7,
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
  const { intensity, contrast, motion, bloom, hueShift } = settings;
  const motionSpeed = motionMultiplier[motion];
  return (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast}) hue-rotate(${hueShift}deg)` }}>
    <div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(160deg, rgba(10,14,40,0.72), rgba(22,18,48,0.72))', opacity: withAlpha(1, intensity * bloom) }}
    />
    <div
      className="animate-float absolute -left-20 -top-20 h-[560px] w-[560px] rounded-full opacity-45 blur-[120px]"
      style={{ background: 'radial-gradient(circle, rgba(102,126,234,0.8) 0%, transparent 70%)', opacity: withAlpha(0.45, intensity * bloom), animationDuration: `${6 * motionSpeed}s` }}
    />
    <div
      className="animate-float-delayed absolute right-[-120px] top-[15%] h-[520px] w-[520px] rounded-full opacity-40 blur-[120px]"
      style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.7) 0%, transparent 68%)', opacity: withAlpha(0.4, intensity * bloom), animationDuration: `${8 * motionSpeed}s` }}
    />
    <div
      className="animate-blob-pulse absolute bottom-[-140px] left-[20%] h-[460px] w-[460px] rounded-full opacity-35 blur-[100px]"
      style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.65) 0%, transparent 72%)', opacity: withAlpha(0.35, intensity * bloom), animationDuration: `${5 * motionSpeed}s` }}
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
  const { intensity, contrast, motion, dotSize, density } = settings;
  const motionSpeed = motionMultiplier[motion];
  return (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(145deg, rgba(2,6,23,0.98), rgba(15,23,42,0.98))',
        opacity: withAlpha(1, intensity),
      }}
    />
    <svg className="animate-pulse-slow absolute inset-0 h-full w-full" style={{ opacity: withAlpha(0.22, intensity * density), animationDuration: `${3.5 * motionSpeed}s` }}>
      <defs>
        <pattern id="dots-grid" width={22 / density} height={22 / density} patternUnits="userSpaceOnUse">
          <circle cx="1.8" cy="1.8" r={dotSize} fill="rgba(148,163,184,0.65)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots-grid)" />
    </svg>
    <div
      className="absolute left-0 right-0 top-1/3 h-px opacity-30"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.9), transparent)', opacity: withAlpha(0.3, intensity) }}
    />
  </div>
  );
};

const WavesDecor = ({ settings }: { settings: WavesSettings }) => {
  const { intensity, contrast, motion, amplitude, thickness } = settings;
  const motionSpeed = motionMultiplier[motion];
  return (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ filter: `contrast(${contrast})` }}>
    <div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(160deg, rgba(10,10,26,0.98), rgba(30,27,75,0.98))', opacity: withAlpha(1, intensity) }}
    />
    <svg className="animate-float absolute inset-0 h-full w-full" style={{ opacity: withAlpha(0.35, intensity), animationDuration: `${7 * motionSpeed}s` }} viewBox="0 0 1440 900" preserveAspectRatio="none">
      <path d={`M0,${280 * amplitude} C260,${220 * amplitude} 420,${360 * amplitude} 690,${300 * amplitude} C950,${240 * amplitude} 1130,${350 * amplitude} 1440,${280 * amplitude}`} stroke="rgba(56,189,248,0.8)" strokeWidth={thickness} fill="none" />
      <path d={`M0,${360 * amplitude} C280,${300 * amplitude} 460,${430 * amplitude} 730,${365 * amplitude} C1020,${300 * amplitude} 1210,${420 * amplitude} 1440,${350 * amplitude}`} stroke="rgba(167,139,250,0.7)" strokeWidth={thickness} fill="none" />
      <path d={`M0,${450 * amplitude} C300,${390 * amplitude} 510,${520 * amplitude} 790,${445 * amplitude} C1040,${378 * amplitude} 1240,${510 * amplitude} 1440,${430 * amplitude}`} stroke="rgba(244,114,182,0.55)" strokeWidth={thickness} fill="none" />
    </svg>
    <div
      className="absolute -left-28 top-1/4 h-[380px] w-[380px] rounded-full opacity-20 blur-[100px]"
      style={{ background: 'rgba(56,189,248,0.6)', opacity: withAlpha(0.2, intensity) }}
    />
    <div
      className="absolute -right-24 bottom-1/4 h-[340px] w-[340px] rounded-full opacity-20 blur-[90px]"
      style={{ background: 'rgba(244,114,182,0.55)', opacity: withAlpha(0.2, intensity) }}
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
