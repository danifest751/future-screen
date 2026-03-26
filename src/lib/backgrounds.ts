export type BackgroundId = 'theme' | 'aurora' | 'mesh' | 'dots' | 'waves' | 'rings' | 'nebula';
export type CustomBackgroundId = Exclude<BackgroundId, 'theme'>;
export type BackgroundMotion = 'slow' | 'normal' | 'fast';

type CommonSettings = {
  motion: BackgroundMotion;
  intensity: number;
  contrast: number;
};

export type AuroraSettings = CommonSettings & {
  bloom: number;
  hueShift: number;
};

export type MeshSettings = CommonSettings & {
  gridOpacity: number;
  glow: number;
};

export type DotsSettings = CommonSettings & {
  dotSize: number;
  density: number;
};

export type WavesSettings = CommonSettings & {
  amplitude: number;
  thickness: number;
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
  aurora: { motion: 'normal', intensity: 1, contrast: 1, bloom: 1, hueShift: 0 },
  mesh: { motion: 'normal', intensity: 1, contrast: 1, gridOpacity: 0.08, glow: 0.3 },
  dots: { motion: 'normal', intensity: 1, contrast: 1, dotSize: 1.2, density: 1 },
  waves: { motion: 'normal', intensity: 1, contrast: 1, amplitude: 1, thickness: 1.5 },
  rings: { motion: 'normal', intensity: 1, contrast: 1, rings: 5, spread: 1 },
  nebula: { motion: 'normal', intensity: 1, contrast: 1, grain: 0.18, hueShift: 0 },
};

export type BackgroundSettingControl = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
};

export const backgroundSettingsControls: Record<CustomBackgroundId, BackgroundSettingControl[]> = {
  aurora: [
    { key: 'intensity', label: 'Интенсивность', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'bloom', label: 'Свечение', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'hueShift', label: 'Сдвиг оттенка', min: -40, max: 40, step: 1 },
  ],
  mesh: [
    { key: 'intensity', label: 'Интенсивность', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'gridOpacity', label: 'Видимость сетки', min: 0.03, max: 0.2, step: 0.01 },
    { key: 'glow', label: 'Glow', min: 0.1, max: 0.8, step: 0.05 },
  ],
  dots: [
    { key: 'intensity', label: 'Интенсивность', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'dotSize', label: 'Размер точек', min: 0.6, max: 2.4, step: 0.1 },
    { key: 'density', label: 'Плотность', min: 0.6, max: 1.8, step: 0.1 },
  ],
  waves: [
    { key: 'intensity', label: 'Интенсивность', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'amplitude', label: 'Амплитуда', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'thickness', label: 'Толщина линий', min: 0.8, max: 3, step: 0.1 },
  ],
  rings: [
    { key: 'intensity', label: 'Интенсивность', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'rings', label: 'Количество колец', min: 2, max: 10, step: 1 },
    { key: 'spread', label: 'Разброс', min: 0.6, max: 1.8, step: 0.1 },
  ],
  nebula: [
    { key: 'intensity', label: 'Интенсивность', min: 0.6, max: 1.8, step: 0.1 },
    { key: 'contrast', label: 'Контраст', min: 0.7, max: 1.6, step: 0.1 },
    { key: 'grain', label: 'Шум', min: 0.05, max: 0.35, step: 0.01 },
    { key: 'hueShift', label: 'Сдвиг оттенка', min: -60, max: 60, step: 1 },
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
      bloom: clamp(Number(raw.bloom ?? fallback.bloom), 0.6, 1.8),
      hueShift: clamp(Number(raw.hueShift ?? fallback.hueShift), -40, 40),
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
      dotSize: clamp(Number(raw.dotSize ?? fallback.dotSize), 0.6, 2.4),
      density: clamp(Number(raw.density ?? fallback.density), 0.6, 1.8),
    } as BackgroundSettingsById[T];
  }

  if (id === 'waves') {
    return {
      ...common,
      amplitude: clamp(Number(raw.amplitude ?? fallback.amplitude), 0.6, 1.8),
      thickness: clamp(Number(raw.thickness ?? fallback.thickness), 0.8, 3),
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
