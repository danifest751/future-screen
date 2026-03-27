import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSiteSettings } from '../hooks/useSiteSettings';
import {
  isCustomBackgroundId,
  type BackgroundId,
} from '../lib/backgrounds';
import {
  ColorBendsDecorLazy,
  PixelBlastDecorLazy,
  LineWavesDecorLazy,
  GalaxyDecorLazy,
  AuroraDecorLazy,
  MeshDecorLazy,
  DotsDecorLazy,
  WavesDecorLazy,
  RingsDecorLazy,
  NebulaDecorLazy,
} from './backgrounds/ReactBitsLazy';

// Lazy-loaded heavy ReactBits backgrounds
const ColorBendsDecor = ColorBendsDecorLazy;
const PixelBlastDecor = PixelBlastDecorLazy;
const LineWavesDecor = LineWavesDecorLazy;
const GalaxyDecor = GalaxyDecorLazy;
const AuroraDecor = AuroraDecorLazy;
const MeshDecor = MeshDecorLazy;
const DotsDecor = DotsDecorLazy;
const WavesDecor = WavesDecorLazy;
const RingsDecor = RingsDecorLazy;
const NebulaDecor = NebulaDecorLazy;

const BackgroundDecor = () => {
  const { theme } = useTheme();
  const { settings, loading } = useSiteSettings();

  const background = settings.background;
  const settingsMap = settings.backgroundSettings;

  useEffect(() => {
    document.documentElement.setAttribute('data-background', background);
    return () => {
      document.documentElement.setAttribute('data-background', 'theme');
    };
  }, [background]);

  // Показываем дефолтный фон пока загружаются настройки
  if (loading) {
    return theme.id === 'light' ? <LightDecor /> : <DefaultDecor />;
  }

  if (isCustomBackgroundId(background)) {
    if (background === 'aurora') return <AuroraDecor key="aurora" settings={settingsMap.aurora} />;
    if (background === 'mesh') return <MeshDecor key="mesh" settings={settingsMap.mesh} />;
    if (background === 'dots') return <DotsDecor key="dots" settings={settingsMap.dots} />;
    if (background === 'waves') return <WavesDecor key="waves" settings={settingsMap.waves} />;
    if (background === 'rings') return <RingsDecor key="rings" settings={settingsMap.rings} />;
    if (background === 'color-bends') return <ColorBendsDecor key="color-bends" settings={settingsMap['color-bends']} />;
    if (background === 'pixel-blast') return <PixelBlastDecor key="pixel-blast" settings={settingsMap['pixel-blast']} />;
    if (background === 'line-waves') return <LineWavesDecor key="line-waves" settings={settingsMap['line-waves']} />;
    if (background === 'galaxy') return <GalaxyDecor key="galaxy" settings={settingsMap.galaxy} />;
    return <NebulaDecor key="nebula" settings={settingsMap.nebula} />;
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

export default BackgroundDecor;
