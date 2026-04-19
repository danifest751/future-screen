import {
  defaultBackgroundSettingsById,
  defaultStarBorderSettings,
  isBackgroundId,
  type BackgroundId,
  type BackgroundSettingsById,
  type StarBorderSettings,
} from './backgrounds';
import type { Database } from './database.types';

export const SITE_SETTINGS_ID = 'default';
export const LEGACY_SITE_SETTINGS_ID = 'global';

export type SiteSettingsRow = Database['public']['Tables']['site_settings']['Row'];

export type SiteSettings = {
  background: BackgroundId;
  backgroundSettings: BackgroundSettingsById;
  starBorder: StarBorderSettings;
};

export type SiteSettingsPatch = {
  background?: BackgroundId;
  backgroundSettings?: BackgroundSettingsById;
  starBorder?: Partial<StarBorderSettings>;
};

const cloneDefaultBackgroundSettings = (): BackgroundSettingsById => ({
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

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  background: 'theme',
  backgroundSettings: cloneDefaultBackgroundSettings(),
  starBorder: { ...defaultStarBorderSettings },
};

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const mergeSection = <T extends Record<string, unknown>>(defaults: T, value: unknown): T => {
  const source = asObject(value);
  if (!source) return { ...defaults };
  return {
    ...defaults,
    ...(source as Partial<T>),
  };
};

const mergeBackgroundSettings = (value: unknown): BackgroundSettingsById => {
  const defaults = cloneDefaultBackgroundSettings();
  const source = asObject(value);
  if (!source) return defaults;

  return {
    aurora: mergeSection(defaults.aurora, source.aurora),
    mesh: mergeSection(defaults.mesh, source.mesh),
    dots: mergeSection(defaults.dots, source.dots),
    waves: mergeSection(defaults.waves, source.waves),
    rings: mergeSection(defaults.rings, source.rings),
    nebula: mergeSection(defaults.nebula, source.nebula),
    'color-bends': mergeSection(defaults['color-bends'], source['color-bends']),
    'pixel-blast': mergeSection(defaults['pixel-blast'], source['pixel-blast']),
    'line-waves': mergeSection(defaults['line-waves'], source['line-waves']),
    galaxy: mergeSection(defaults.galaxy, source.galaxy),
  };
};

const mergeStarBorderSettings = (value: unknown): StarBorderSettings => {
  const source = asObject(value);
  if (!source) return { ...defaultStarBorderSettings };

  return {
    ...defaultStarBorderSettings,
    enabled:
      typeof source.enabled === 'boolean' ? source.enabled : defaultStarBorderSettings.enabled,
    color: typeof source.color === 'string' ? source.color : defaultStarBorderSettings.color,
    speed: typeof source.speed === 'number' ? source.speed : defaultStarBorderSettings.speed,
    thickness:
      typeof source.thickness === 'number' ? source.thickness : defaultStarBorderSettings.thickness,
    intensity:
      typeof source.intensity === 'number' ? source.intensity : defaultStarBorderSettings.intensity,
    cornerOffset:
      typeof source.cornerOffset === 'number'
        ? source.cornerOffset
        : defaultStarBorderSettings.cornerOffset,
  };
};

const normalizeBackground = (value: unknown): BackgroundId =>
  typeof value === 'string' && isBackgroundId(value) ? value : DEFAULT_SITE_SETTINGS.background;

export const normalizeSiteSettingsRow = (row: Partial<SiteSettingsRow> | null | undefined): SiteSettings => ({
  background: normalizeBackground(row?.background),
  backgroundSettings: mergeBackgroundSettings(row?.background_settings),
  starBorder: mergeStarBorderSettings(row?.star_border_settings),
});

export const selectPreferredSiteSettingsRow = (
  rows: Array<Partial<SiteSettingsRow>> | null | undefined,
): Partial<SiteSettingsRow> | null => {
  if (!rows || rows.length === 0) return null;

  const defaultRow = rows.find((row) => row.id === SITE_SETTINGS_ID);
  if (defaultRow) return defaultRow;

  const legacyRow = rows.find((row) => row.id === LEGACY_SITE_SETTINGS_ID);
  if (legacyRow) return legacyRow;

  return rows[0] ?? null;
};
