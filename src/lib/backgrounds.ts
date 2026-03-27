export type BackgroundId =
  | 'theme'
  | 'aurora'
  | 'mesh'
  | 'dots'
  | 'waves'
  | 'rings'
  | 'nebula'
  | 'color-bends'
  | 'pixel-blast'
  | 'line-waves'
  | 'galaxy';
export type CustomBackgroundId = Exclude<BackgroundId, 'theme'>;
export type BackgroundMotion = 'slow' | 'normal' | 'fast';

type CommonSettings = {
  motion: BackgroundMotion;
  intensity: number;
  contrast: number;
};

export type AuroraSettings = CommonSettings & {
  color1: string;
  color2: string;
  color3: string;
  speed: number;
  blend: number;
  amplitude: number;
};

export type MeshSettings = CommonSettings & {
  gridOpacity: number;
  glow: number;
};

export type DotsSettings = CommonSettings & {
  dotSize: number;
  gap: number;
  baseColor: string;
  activeColor: string;
  proximity: number;
  speedTrigger: number;
  shockRadius: number;
  shockStrength: number;
  maxSpeed: number;
  resistance: number;
  returnDuration: number;
};

export type WavesSettings = CommonSettings & {
  lineColor: string;
  backgroundColor: string;
  waveSpeedX: number;
  waveSpeedY: number;
  waveAmpX: number;
  waveAmpY: number;
  xGap: number;
  yGap: number;
  friction: number;
  tension: number;
  maxCursorMove: number;
};

export type RingsSettings = CommonSettings & {
  rings: number;
  spread: number;
};

export type NebulaSettings = CommonSettings & {
  grain: number;
  hueShift: number;
};

export type ColorBendsSettings = CommonSettings & {
  color1: string;
  color2: string;
  color3: string;
  speed: number;
  rotation: number;
  autoRotate: number;
  scale: number;
  frequency: number;
  warpStrength: number;
  mouseInfluence: number;
  parallax: number;
  noise: number;
};

export type PixelBlastSettings = CommonSettings & {
  color: string;
  pixelSize: number;
  patternScale: number;
  patternDensity: number;
  pixelJitter: number;
  rippleIntensity: number;
  rippleThickness: number;
  rippleSpeed: number;
  edgeFade: number;
  liquidStrength: number;
  liquidRadius: number;
  wobbleSpeed: number;
};

export type LineWavesSettings = CommonSettings & {
  color1: string;
  color2: string;
  color3: string;
  speed: number;
  innerLineCount: number;
  outerLineCount: number;
  warpIntensity: number;
  rotation: number;
  edgeFadeWidth: number;
  colorCycleSpeed: number;
  brightness: number;
  mouseInfluence: number;
};

export type GalaxySettings = CommonSettings & {
  focalX: number;
  focalY: number;
  rotationX: number;
  rotationY: number;
  starSpeed: number;
  density: number;
  hueShift: number;
  speed: number;
  glowIntensity: number;
  saturation: number;
  repulsionStrength: number;
  twinkleIntensity: number;
  rotationSpeed: number;
  autoCenterRepulsion: number;
};

export type BackgroundSettingsById = {
  aurora: AuroraSettings;
  mesh: MeshSettings;
  dots: DotsSettings;
  waves: WavesSettings;
  rings: RingsSettings;
  nebula: NebulaSettings;
  'color-bends': ColorBendsSettings;
  'pixel-blast': PixelBlastSettings;
  'line-waves': LineWavesSettings;
  galaxy: GalaxySettings;
};

export type AnyBackgroundSettings = BackgroundSettingsById[CustomBackgroundId];

// Star Border Settings
export type StarBorderSettings = {
  enabled: boolean;
  color: string;
  speed: number; // in seconds
  thickness: number;
  intensity: number;
  cornerOffset: number;
};

export const defaultStarBorderSettings: StarBorderSettings = {
  enabled: false,
  color: '#8aa2ff',
  speed: 6,
  thickness: 2.5,
  intensity: 1,
  cornerOffset: 0,
};

export const starBorderSettingsControls = [
  { key: 'intensity', label: 'Интенсивность', control: 'range', min: 0.5, max: 2, step: 0.1 },
  { key: 'color', label: 'Цвет рамки', control: 'color' },
  { key: 'speed', label: 'Скорость анимации (сек)', control: 'range', min: 2, max: 15, step: 0.5 },
  { key: 'thickness', label: 'Толщина рамки', control: 'range', min: 1, max: 5, step: 0.5 },
  { key: 'cornerOffset', label: 'Отступ старта от угла (px)', control: 'range', min: 0, max: 80, step: 1 },
] as const;

export const BACKGROUND_STORAGE_KEY = 'fs-background';
export const BACKGROUND_CHANGED_EVENT = 'fs-background-changed';
export const BACKGROUND_SETTINGS_STORAGE_KEY = 'fs-background-settings';
export const BACKGROUND_SETTINGS_CHANGED_EVENT = 'fs-background-settings-changed';

export const defaultBackgroundSettingsById: BackgroundSettingsById = {
  aurora: {
    motion: 'normal',
    intensity: 1,
    contrast: 1,
    color1: '#3A29FF',
    color2: '#FF94B4',
    color3: '#FF3232',
    speed: 1,
    blend: 0.5,
    amplitude: 1,
  },
  mesh: { motion: 'normal', intensity: 1, contrast: 1, gridOpacity: 0.08, glow: 0.3 },
  dots: {
    motion: 'normal',
    intensity: 1,
    contrast: 1,
    dotSize: 16,
    gap: 32,
    baseColor: '#5227FF',
    activeColor: '#5227FF',
    proximity: 150,
    speedTrigger: 100,
    shockRadius: 250,
    shockStrength: 5,
    maxSpeed: 5000,
    resistance: 750,
    returnDuration: 1.5,
  },
  waves: {
    motion: 'normal',
    intensity: 1,
    contrast: 1,
    lineColor: '#FFFFFF',
    backgroundColor: '#070112',
    waveSpeedX: 0.0125,
    waveSpeedY: 0.005,
    waveAmpX: 32,
    waveAmpY: 16,
    xGap: 10,
    yGap: 32,
    friction: 0.925,
    tension: 0.005,
    maxCursorMove: 100,
  },
  rings: { motion: 'normal', intensity: 1, contrast: 1, rings: 5, spread: 1 },
  nebula: { motion: 'normal', intensity: 1, contrast: 1, grain: 0.18, hueShift: 0 },
  'color-bends': {
    motion: 'normal',
    intensity: 1,
    contrast: 1,
    color1: '#5227FF',
    color2: '#FF7A00',
    color3: '#00D1FF',
    speed: 0.2,
    rotation: 45,
    autoRotate: 0,
    scale: 1,
    frequency: 1,
    warpStrength: 1,
    mouseInfluence: 1,
    parallax: 0.5,
    noise: 0.1,
  },
  'pixel-blast': {
    motion: 'normal',
    intensity: 1,
    contrast: 1,
    color: '#B19EEF',
    pixelSize: 3,
    patternScale: 2,
    patternDensity: 1,
    pixelJitter: 0,
    rippleIntensity: 1,
    rippleThickness: 0.1,
    rippleSpeed: 0.3,
    edgeFade: 0.5,
    liquidStrength: 0.1,
    liquidRadius: 1,
    wobbleSpeed: 4.5,
  },
  'line-waves': {
    motion: 'normal',
    intensity: 1,
    contrast: 1,
    color1: '#FFFFFF',
    color2: '#9AD0FF',
    color3: '#FFD0F3',
    speed: 0.3,
    innerLineCount: 32,
    outerLineCount: 36,
    warpIntensity: 1,
    rotation: -45,
    edgeFadeWidth: 0,
    colorCycleSpeed: 1,
    brightness: 0.2,
    mouseInfluence: 2,
  },
  galaxy: {
    motion: 'normal',
    intensity: 1,
    contrast: 1,
    focalX: 0.5,
    focalY: 0.5,
    rotationX: 1,
    rotationY: 0,
    starSpeed: 0.5,
    density: 1,
    hueShift: 140,
    speed: 1,
    glowIntensity: 0.3,
    saturation: 0,
    repulsionStrength: 2,
    twinkleIntensity: 0.3,
    rotationSpeed: 0.1,
    autoCenterRepulsion: 0,
  },
};

export type BackgroundSettingControl = {
  key: string;
  label: string;
  control: 'range' | 'color';
  min?: number;
  max?: number;
  step?: number;
};

export const backgroundSettingsControls: Record<CustomBackgroundId, BackgroundSettingControl[]> = {
  aurora: [
    { key: 'intensity', label: 'Интенсивность', control: 'range', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', control: 'range', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'color1', label: 'Цвет 1', control: 'color' },
    { key: 'color2', label: 'Цвет 2', control: 'color' },
    { key: 'color3', label: 'Цвет 3', control: 'color' },
    { key: 'speed', label: 'Speed', control: 'range', min: 0.2, max: 3, step: 0.1 },
    { key: 'blend', label: 'Blend', control: 'range', min: 0, max: 1, step: 0.05 },
    { key: 'amplitude', label: 'Amplitude', control: 'range', min: 0.2, max: 2.5, step: 0.1 },
  ],
  mesh: [
    { key: 'intensity', label: 'Интенсивность', control: 'range', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', control: 'range', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'gridOpacity', label: 'Видимость сетки', control: 'range', min: 0.03, max: 0.2, step: 0.01 },
    { key: 'glow', label: 'Glow', control: 'range', min: 0.1, max: 0.8, step: 0.05 },
  ],
  dots: [
    { key: 'intensity', label: 'Интенсивность', control: 'range', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', control: 'range', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'dotSize', label: 'Dot Size', control: 'range', min: 4, max: 40, step: 1 },
    { key: 'gap', label: 'Gap', control: 'range', min: 8, max: 80, step: 1 },
    { key: 'baseColor', label: 'Base Color', control: 'color' },
    { key: 'activeColor', label: 'Active Color', control: 'color' },
    { key: 'proximity', label: 'Proximity', control: 'range', min: 50, max: 400, step: 5 },
    { key: 'speedTrigger', label: 'Speed Trigger', control: 'range', min: 20, max: 300, step: 5 },
    { key: 'shockRadius', label: 'Shock Radius', control: 'range', min: 80, max: 500, step: 5 },
    { key: 'shockStrength', label: 'Shock Strength', control: 'range', min: 1, max: 12, step: 0.5 },
    { key: 'maxSpeed', label: 'Max Speed', control: 'range', min: 500, max: 10000, step: 100 },
    { key: 'resistance', label: 'Resistance', control: 'range', min: 100, max: 2000, step: 25 },
    { key: 'returnDuration', label: 'Return Duration', control: 'range', min: 0.1, max: 4, step: 0.1 },
  ],
  waves: [
    { key: 'intensity', label: 'Интенсивность', control: 'range', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', control: 'range', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'lineColor', label: 'Waves Color', control: 'color' },
    { key: 'backgroundColor', label: 'Background Color', control: 'color' },
    { key: 'waveSpeedX', label: 'Wave Speed X', control: 'range', min: 0.001, max: 0.06, step: 0.001 },
    { key: 'waveSpeedY', label: 'Wave Speed Y', control: 'range', min: 0.001, max: 0.03, step: 0.001 },
    { key: 'waveAmpX', label: 'Wave Amp X', control: 'range', min: 4, max: 80, step: 1 },
    { key: 'waveAmpY', label: 'Wave Amp Y', control: 'range', min: 4, max: 60, step: 1 },
    { key: 'xGap', label: 'X Gap', control: 'range', min: 4, max: 28, step: 1 },
    { key: 'yGap', label: 'Y Gap', control: 'range', min: 8, max: 80, step: 1 },
    { key: 'friction', label: 'Friction', control: 'range', min: 0.8, max: 0.99, step: 0.005 },
    { key: 'tension', label: 'Tension', control: 'range', min: 0.001, max: 0.02, step: 0.001 },
    { key: 'maxCursorMove', label: 'Max Cursor Move', control: 'range', min: 20, max: 220, step: 2 },
  ],
  rings: [
    { key: 'intensity', label: 'Интенсивность', control: 'range', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', control: 'range', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'rings', label: 'Количество колец', control: 'range', min: 2, max: 10, step: 1 },
    { key: 'spread', label: 'Разброс', control: 'range', min: 0.6, max: 1.8, step: 0.1 },
  ],
  nebula: [
    { key: 'intensity', label: 'Интенсивность', control: 'range', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', control: 'range', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'grain', label: 'Шум', control: 'range', min: 0.05, max: 0.35, step: 0.01 },
    { key: 'hueShift', label: 'Сдвиг оттенка', control: 'range', min: -60, max: 60, step: 1 },
  ],
  'color-bends': [
    { key: 'intensity', label: 'Интенсивность', control: 'range', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', control: 'range', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'color1', label: 'Color 1', control: 'color' },
    { key: 'color2', label: 'Color 2', control: 'color' },
    { key: 'color3', label: 'Color 3', control: 'color' },
    { key: 'speed', label: 'Speed', control: 'range', min: 0.05, max: 2, step: 0.05 },
    { key: 'rotation', label: 'Rotation', control: 'range', min: -180, max: 180, step: 1 },
    { key: 'autoRotate', label: 'Auto Rotate', control: 'range', min: -2, max: 2, step: 0.05 },
    { key: 'scale', label: 'Scale', control: 'range', min: 0.4, max: 2.5, step: 0.1 },
    { key: 'frequency', label: 'Frequency', control: 'range', min: 0.3, max: 3, step: 0.1 },
    { key: 'warpStrength', label: 'Warp Strength', control: 'range', min: 0, max: 2.5, step: 0.1 },
    { key: 'mouseInfluence', label: 'Mouse Influence', control: 'range', min: 0, max: 3, step: 0.1 },
    { key: 'parallax', label: 'Parallax', control: 'range', min: 0, max: 2, step: 0.1 },
    { key: 'noise', label: 'Noise', control: 'range', min: 0, max: 0.6, step: 0.01 },
  ],
  'pixel-blast': [
    { key: 'intensity', label: 'Интенсивность', control: 'range', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', control: 'range', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'color', label: 'Color', control: 'color' },
    { key: 'pixelSize', label: 'Pixel Size', control: 'range', min: 1, max: 10, step: 1 },
    { key: 'patternScale', label: 'Pattern Scale', control: 'range', min: 0.5, max: 6, step: 0.1 },
    { key: 'patternDensity', label: 'Pattern Density', control: 'range', min: 0.2, max: 2, step: 0.1 },
    { key: 'pixelJitter', label: 'Pixel Jitter', control: 'range', min: 0, max: 1, step: 0.05 },
    { key: 'rippleIntensity', label: 'Ripple Intensity', control: 'range', min: 0, max: 3, step: 0.1 },
    { key: 'rippleThickness', label: 'Ripple Thickness', control: 'range', min: 0.02, max: 0.8, step: 0.01 },
    { key: 'rippleSpeed', label: 'Ripple Speed', control: 'range', min: 0.05, max: 1.5, step: 0.05 },
    { key: 'edgeFade', label: 'Edge Fade', control: 'range', min: 0, max: 1, step: 0.05 },
    { key: 'liquidStrength', label: 'Liquid Strength', control: 'range', min: 0, max: 1, step: 0.05 },
    { key: 'liquidRadius', label: 'Liquid Radius', control: 'range', min: 0.2, max: 3, step: 0.1 },
    { key: 'wobbleSpeed', label: 'Wobble Speed', control: 'range', min: 0.5, max: 10, step: 0.1 },
  ],
  'line-waves': [
    { key: 'intensity', label: 'Интенсивность', control: 'range', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', control: 'range', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'color1', label: 'Color 1', control: 'color' },
    { key: 'color2', label: 'Color 2', control: 'color' },
    { key: 'color3', label: 'Color 3', control: 'color' },
    { key: 'speed', label: 'Speed', control: 'range', min: 0.05, max: 1.5, step: 0.05 },
    { key: 'innerLineCount', label: 'Inner Lines', control: 'range', min: 8, max: 80, step: 1 },
    { key: 'outerLineCount', label: 'Outer Lines', control: 'range', min: 8, max: 100, step: 1 },
    { key: 'warpIntensity', label: 'Warp Intensity', control: 'range', min: 0, max: 3, step: 0.1 },
    { key: 'rotation', label: 'Rotation', control: 'range', min: -180, max: 180, step: 1 },
    { key: 'edgeFadeWidth', label: 'Edge Fade Width', control: 'range', min: 0, max: 1, step: 0.05 },
    { key: 'colorCycleSpeed', label: 'Color Cycle Speed', control: 'range', min: 0, max: 3, step: 0.1 },
    { key: 'brightness', label: 'Brightness', control: 'range', min: 0.05, max: 1, step: 0.05 },
    { key: 'mouseInfluence', label: 'Mouse Influence', control: 'range', min: 0, max: 5, step: 0.1 },
  ],
  galaxy: [
    { key: 'intensity', label: 'Интенсивность', control: 'range', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', control: 'range', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'focalX', label: 'Focal X', control: 'range', min: 0, max: 1, step: 0.01 },
    { key: 'focalY', label: 'Focal Y', control: 'range', min: 0, max: 1, step: 0.01 },
    { key: 'rotationX', label: 'Rotation X', control: 'range', min: -1, max: 1, step: 0.01 },
    { key: 'rotationY', label: 'Rotation Y', control: 'range', min: -1, max: 1, step: 0.01 },
    { key: 'starSpeed', label: 'Star Speed', control: 'range', min: 0, max: 2, step: 0.05 },
    { key: 'density', label: 'Density', control: 'range', min: 0.3, max: 3, step: 0.1 },
    { key: 'hueShift', label: 'Hue Shift', control: 'range', min: -180, max: 180, step: 1 },
    { key: 'speed', label: 'Speed', control: 'range', min: 0, max: 3, step: 0.1 },
    { key: 'glowIntensity', label: 'Glow Intensity', control: 'range', min: 0, max: 1, step: 0.05 },
    { key: 'saturation', label: 'Saturation', control: 'range', min: 0, max: 2, step: 0.05 },
    { key: 'repulsionStrength', label: 'Repulsion Strength', control: 'range', min: 0, max: 6, step: 0.1 },
    { key: 'twinkleIntensity', label: 'Twinkle Intensity', control: 'range', min: 0, max: 1, step: 0.05 },
    { key: 'rotationSpeed', label: 'Rotation Speed', control: 'range', min: -1, max: 1, step: 0.01 },
    { key: 'autoCenterRepulsion', label: 'Auto Center Repulsion', control: 'range', min: 0, max: 2, step: 0.05 },
  ],
};

export type BackgroundOption = {
  id: BackgroundId;
  name: string;
  description: string;
};

export const backgroundOptions: BackgroundOption[] = [
  { id: 'theme', name: 'По теме', description: 'Автовыбор по текущей теме сайта' },
  { id: 'aurora', name: 'Aurora', description: 'Мягкие переливы и сияние' },
  { id: 'mesh', name: 'Mesh Grid', description: 'Градиентная сетка в стиле React Bits' },
  { id: 'dots', name: 'Dot Matrix', description: 'Паттерн из точек с подсветкой' },
  { id: 'waves', name: 'Waves', description: 'Линейные волны и glow-слои' },
  { id: 'rings', name: 'Rings', description: 'Концентрические кольца и мягкий glow' },
  { id: 'nebula', name: 'Nebula', description: 'Туманность, зерно и цветовые сдвиги' },
  { id: 'color-bends', name: 'Color Bends', description: 'Плавные жидкие переливы цвета' },
  { id: 'pixel-blast', name: 'Pixel Blast', description: 'Пиксельный шум, рябь и glitch-настроение' },
  { id: 'line-waves', name: 'Line Waves', description: 'Динамические волны из тонких линий' },
  { id: 'galaxy', name: 'Galaxy', description: 'Звёздное поле с глубиной и свечением' },
];

export const isBackgroundId = (value: string | null): value is BackgroundId =>
  Boolean(value) && backgroundOptions.some((option) => option.id === value);

export const isCustomBackgroundId = (value: BackgroundId): value is CustomBackgroundId => value !== 'theme';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeColor = (value: unknown, fallback: string) => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return raw.toUpperCase();
  return fallback.toUpperCase();
};

const normalizeMotion = (value: unknown): BackgroundMotion => {
  if (value === 'slow' || value === 'normal' || value === 'fast') return value;
  return 'normal';
};

const commonSettings = (raw: Record<string, unknown>, fallback: CommonSettings): CommonSettings => ({
  motion: normalizeMotion(raw.motion),
  intensity: clamp(Number(raw.intensity ?? fallback.intensity), 0.6, 1.8),
  contrast: clamp(Number(raw.contrast ?? fallback.contrast), 0.7, 1.6),
});

const normalizeById = <T extends CustomBackgroundId>(id: T, value: unknown): BackgroundSettingsById[T] => {
  const fallback = defaultBackgroundSettingsById[id] as Record<string, unknown>;
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const common = commonSettings(raw, fallback as CommonSettings);

  if (id === 'aurora') {
    return {
      ...common,
      color1: normalizeColor(raw.color1, String(fallback.color1)),
      color2: normalizeColor(raw.color2, String(fallback.color2)),
      color3: normalizeColor(raw.color3, String(fallback.color3)),
      speed: clamp(Number(raw.speed ?? fallback.speed), 0.2, 3),
      blend: clamp(Number(raw.blend ?? fallback.blend), 0, 1),
      amplitude: clamp(Number(raw.amplitude ?? fallback.amplitude), 0.2, 2.5),
    } as BackgroundSettingsById[T];
  }

  if (id === 'mesh') {
    return {
      ...common,
      gridOpacity: clamp(Number(raw.gridOpacity ?? fallback.gridOpacity), 0.03, 0.2),
      glow: clamp(Number(raw.glow ?? fallback.glow), 0.1, 0.8),
    } as BackgroundSettingsById[T];
  }

  if (id === 'dots') {
    return {
      ...common,
      dotSize: clamp(Number(raw.dotSize ?? fallback.dotSize), 4, 40),
      gap: clamp(Number(raw.gap ?? fallback.gap), 8, 80),
      baseColor: normalizeColor(raw.baseColor, String(fallback.baseColor)),
      activeColor: normalizeColor(raw.activeColor, String(fallback.activeColor)),
      proximity: clamp(Number(raw.proximity ?? fallback.proximity), 50, 400),
      speedTrigger: clamp(Number(raw.speedTrigger ?? fallback.speedTrigger), 20, 300),
      shockRadius: clamp(Number(raw.shockRadius ?? fallback.shockRadius), 80, 500),
      shockStrength: clamp(Number(raw.shockStrength ?? fallback.shockStrength), 1, 12),
      maxSpeed: clamp(Number(raw.maxSpeed ?? fallback.maxSpeed), 500, 10000),
      resistance: clamp(Number(raw.resistance ?? fallback.resistance), 100, 2000),
      returnDuration: clamp(Number(raw.returnDuration ?? fallback.returnDuration), 0.1, 4),
    } as BackgroundSettingsById[T];
  }

  if (id === 'waves') {
    return {
      ...common,
      lineColor: normalizeColor(raw.lineColor, String(fallback.lineColor)),
      backgroundColor: normalizeColor(raw.backgroundColor, String(fallback.backgroundColor)),
      waveSpeedX: clamp(Number(raw.waveSpeedX ?? fallback.waveSpeedX), 0.001, 0.06),
      waveSpeedY: clamp(Number(raw.waveSpeedY ?? fallback.waveSpeedY), 0.001, 0.03),
      waveAmpX: clamp(Number(raw.waveAmpX ?? fallback.waveAmpX), 4, 80),
      waveAmpY: clamp(Number(raw.waveAmpY ?? fallback.waveAmpY), 4, 60),
      xGap: Math.round(clamp(Number(raw.xGap ?? fallback.xGap), 4, 28)),
      yGap: Math.round(clamp(Number(raw.yGap ?? fallback.yGap), 8, 80)),
      friction: clamp(Number(raw.friction ?? fallback.friction), 0.8, 0.99),
      tension: clamp(Number(raw.tension ?? fallback.tension), 0.001, 0.02),
      maxCursorMove: clamp(Number(raw.maxCursorMove ?? fallback.maxCursorMove), 20, 220),
    } as BackgroundSettingsById[T];
  }

  if (id === 'rings') {
    return {
      ...common,
      rings: Math.round(clamp(Number(raw.rings ?? fallback.rings), 2, 10)),
      spread: clamp(Number(raw.spread ?? fallback.spread), 0.6, 1.8),
    } as BackgroundSettingsById[T];
  }

  if (id === 'color-bends') {
    return {
      ...common,
      color1: normalizeColor(raw.color1, String(fallback.color1)),
      color2: normalizeColor(raw.color2, String(fallback.color2)),
      color3: normalizeColor(raw.color3, String(fallback.color3)),
      speed: clamp(Number(raw.speed ?? fallback.speed), 0.05, 2),
      rotation: clamp(Number(raw.rotation ?? fallback.rotation), -180, 180),
      autoRotate: clamp(Number(raw.autoRotate ?? fallback.autoRotate), -2, 2),
      scale: clamp(Number(raw.scale ?? fallback.scale), 0.4, 2.5),
      frequency: clamp(Number(raw.frequency ?? fallback.frequency), 0.3, 3),
      warpStrength: clamp(Number(raw.warpStrength ?? fallback.warpStrength), 0, 2.5),
      mouseInfluence: clamp(Number(raw.mouseInfluence ?? fallback.mouseInfluence), 0, 3),
      parallax: clamp(Number(raw.parallax ?? fallback.parallax), 0, 2),
      noise: clamp(Number(raw.noise ?? fallback.noise), 0, 0.6),
    } as BackgroundSettingsById[T];
  }

  if (id === 'pixel-blast') {
    return {
      ...common,
      color: normalizeColor(raw.color, String(fallback.color)),
      pixelSize: Math.round(clamp(Number(raw.pixelSize ?? fallback.pixelSize), 1, 10)),
      patternScale: clamp(Number(raw.patternScale ?? fallback.patternScale), 0.5, 6),
      patternDensity: clamp(Number(raw.patternDensity ?? fallback.patternDensity), 0.2, 2),
      pixelJitter: clamp(Number(raw.pixelJitter ?? fallback.pixelJitter), 0, 1),
      rippleIntensity: clamp(Number(raw.rippleIntensity ?? fallback.rippleIntensity), 0, 3),
      rippleThickness: clamp(Number(raw.rippleThickness ?? fallback.rippleThickness), 0.02, 0.8),
      rippleSpeed: clamp(Number(raw.rippleSpeed ?? fallback.rippleSpeed), 0.05, 1.5),
      edgeFade: clamp(Number(raw.edgeFade ?? fallback.edgeFade), 0, 1),
      liquidStrength: clamp(Number(raw.liquidStrength ?? fallback.liquidStrength), 0, 1),
      liquidRadius: clamp(Number(raw.liquidRadius ?? fallback.liquidRadius), 0.2, 3),
      wobbleSpeed: clamp(Number(raw.wobbleSpeed ?? fallback.wobbleSpeed), 0.5, 10),
    } as BackgroundSettingsById[T];
  }

  if (id === 'line-waves') {
    return {
      ...common,
      color1: normalizeColor(raw.color1, String(fallback.color1)),
      color2: normalizeColor(raw.color2, String(fallback.color2)),
      color3: normalizeColor(raw.color3, String(fallback.color3)),
      speed: clamp(Number(raw.speed ?? fallback.speed), 0.05, 1.5),
      innerLineCount: Math.round(clamp(Number(raw.innerLineCount ?? fallback.innerLineCount), 8, 80)),
      outerLineCount: Math.round(clamp(Number(raw.outerLineCount ?? fallback.outerLineCount), 8, 100)),
      warpIntensity: clamp(Number(raw.warpIntensity ?? fallback.warpIntensity), 0, 3),
      rotation: clamp(Number(raw.rotation ?? fallback.rotation), -180, 180),
      edgeFadeWidth: clamp(Number(raw.edgeFadeWidth ?? fallback.edgeFadeWidth), 0, 1),
      colorCycleSpeed: clamp(Number(raw.colorCycleSpeed ?? fallback.colorCycleSpeed), 0, 3),
      brightness: clamp(Number(raw.brightness ?? fallback.brightness), 0.05, 1),
      mouseInfluence: clamp(Number(raw.mouseInfluence ?? fallback.mouseInfluence), 0, 5),
    } as BackgroundSettingsById[T];
  }

  if (id === 'galaxy') {
    return {
      ...common,
      focalX: clamp(Number(raw.focalX ?? fallback.focalX), 0, 1),
      focalY: clamp(Number(raw.focalY ?? fallback.focalY), 0, 1),
      rotationX: clamp(Number(raw.rotationX ?? fallback.rotationX), -1, 1),
      rotationY: clamp(Number(raw.rotationY ?? fallback.rotationY), -1, 1),
      starSpeed: clamp(Number(raw.starSpeed ?? fallback.starSpeed), 0, 2),
      density: clamp(Number(raw.density ?? fallback.density), 0.3, 3),
      hueShift: clamp(Number(raw.hueShift ?? fallback.hueShift), -180, 180),
      speed: clamp(Number(raw.speed ?? fallback.speed), 0, 3),
      glowIntensity: clamp(Number(raw.glowIntensity ?? fallback.glowIntensity), 0, 1),
      saturation: clamp(Number(raw.saturation ?? fallback.saturation), 0, 2),
      repulsionStrength: clamp(Number(raw.repulsionStrength ?? fallback.repulsionStrength), 0, 6),
      twinkleIntensity: clamp(Number(raw.twinkleIntensity ?? fallback.twinkleIntensity), 0, 1),
      rotationSpeed: clamp(Number(raw.rotationSpeed ?? fallback.rotationSpeed), -1, 1),
      autoCenterRepulsion: clamp(Number(raw.autoCenterRepulsion ?? fallback.autoCenterRepulsion), 0, 2),
    } as BackgroundSettingsById[T];
  }

  return {
    ...common,
    grain: clamp(Number(raw.grain ?? fallback.grain), 0.05, 0.35),
    hueShift: clamp(Number(raw.hueShift ?? fallback.hueShift), -60, 60),
  } as BackgroundSettingsById[T];
};

const getDefaultSettingsMap = (): BackgroundSettingsById => ({
  aurora: { ...defaultBackgroundSettingsById.aurora },
  mesh: { ...defaultBackgroundSettingsById.mesh },
  dots: { ...defaultBackgroundSettingsById.dots },
  waves: { ...defaultBackgroundSettingsById.waves },
  rings: { ...defaultBackgroundSettingsById.rings },
  nebula: { ...defaultBackgroundSettingsById.nebula },
  'color-bends': { ...defaultBackgroundSettingsById['color-bends'] },
  'pixel-blast': { ...defaultBackgroundSettingsById['pixel-blast'] },
  'line-waves': { ...defaultBackgroundSettingsById['line-waves'] },
  galaxy: { ...defaultBackgroundSettingsById.galaxy },
});

export const getStoredBackground = (): BackgroundId => {
  const raw = localStorage.getItem(BACKGROUND_STORAGE_KEY);
  if (isBackgroundId(raw)) return raw;
  return 'theme';
};

export const getStoredBackgroundSettingsMap = (): BackgroundSettingsById => {
  const defaults = getDefaultSettingsMap();
  const raw = localStorage.getItem(BACKGROUND_SETTINGS_STORAGE_KEY);
  if (!raw) return defaults;

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (parsed && typeof parsed === 'object' && ('motion' in (parsed as Record<string, unknown>))) {
      const legacy = parsed as Record<string, unknown>;
      return {
        aurora: normalizeById('aurora', legacy),
        mesh: normalizeById('mesh', legacy),
        dots: normalizeById('dots', legacy),
        waves: normalizeById('waves', legacy),
        rings: normalizeById('rings', legacy),
        nebula: normalizeById('nebula', legacy),
        'color-bends': normalizeById('color-bends', legacy),
        'pixel-blast': normalizeById('pixel-blast', legacy),
        'line-waves': normalizeById('line-waves', legacy),
        galaxy: normalizeById('galaxy', legacy),
      };
    }

    const map = parsed as Partial<Record<CustomBackgroundId, unknown>>;
    return {
      aurora: normalizeById('aurora', map.aurora),
      mesh: normalizeById('mesh', map.mesh),
      dots: normalizeById('dots', map.dots),
      waves: normalizeById('waves', map.waves),
      rings: normalizeById('rings', map.rings),
      nebula: normalizeById('nebula', map.nebula),
      'color-bends': normalizeById('color-bends', map['color-bends']),
      'pixel-blast': normalizeById('pixel-blast', map['pixel-blast']),
      'line-waves': normalizeById('line-waves', map['line-waves']),
      galaxy: normalizeById('galaxy', map.galaxy),
    };
  } catch {
    return defaults;
  }
};

export const getStoredBackgroundSettings = <T extends CustomBackgroundId>(background: T): BackgroundSettingsById[T] => {
  const map = getStoredBackgroundSettingsMap();
  return map[background];
};

export const setStoredBackground = (background: BackgroundId) => {
  localStorage.setItem(BACKGROUND_STORAGE_KEY, background);
  window.dispatchEvent(new CustomEvent(BACKGROUND_CHANGED_EVENT, { detail: background }));
};

export const setStoredBackgroundSettingsMap = (settingsMap: BackgroundSettingsById) => {
  const normalized: BackgroundSettingsById = {
    aurora: normalizeById('aurora', settingsMap.aurora),
    mesh: normalizeById('mesh', settingsMap.mesh),
    dots: normalizeById('dots', settingsMap.dots),
    waves: normalizeById('waves', settingsMap.waves),
    rings: normalizeById('rings', settingsMap.rings),
    nebula: normalizeById('nebula', settingsMap.nebula),
    'color-bends': normalizeById('color-bends', settingsMap['color-bends']),
    'pixel-blast': normalizeById('pixel-blast', settingsMap['pixel-blast']),
    'line-waves': normalizeById('line-waves', settingsMap['line-waves']),
    galaxy: normalizeById('galaxy', settingsMap.galaxy),
  };

  localStorage.setItem(BACKGROUND_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(BACKGROUND_SETTINGS_CHANGED_EVENT, { detail: normalized }));
};

export const patchStoredBackgroundSettings = (background: CustomBackgroundId, patch: Partial<AnyBackgroundSettings>) => {
  const settingsMap = getStoredBackgroundSettingsMap();
  const merged = {
    ...settingsMap[background],
    ...patch,
  };

  const nextMap: BackgroundSettingsById = {
    ...settingsMap,
    [background]: normalizeById(background, merged),
  };

  setStoredBackgroundSettingsMap(nextMap);
};
