export type BackgroundId = 'theme' | 'aurora' | 'mesh' | 'dots' | 'waves' | 'rings' | 'nebula';
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

export type BackgroundSettingsById = {
  aurora: AuroraSettings;
  mesh: MeshSettings;
  dots: DotsSettings;
  waves: WavesSettings;
  rings: RingsSettings;
  nebula: NebulaSettings;
};

export type AnyBackgroundSettings = BackgroundSettingsById[CustomBackgroundId];

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
