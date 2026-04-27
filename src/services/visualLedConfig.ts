import { supabase } from '../lib/supabase';
import {
  PRESET_NATURAL_WIDTH,
  PRESET_NATURAL_HEIGHT,
  VISUAL_LED_PRESETS,
  type VisualLedPreset,
} from '../lib/visualLed/presets';

// ── Row shapes returned by Supabase ──────────────────────────────────────────

export interface DbPresetRow {
  id: string;
  slug: string;
  name_ru: string;
  name_en: string;
  description_ru: string;
  description_en: string;
  sort_order: number;
  is_active: boolean;
  area_m2: number;
  width_m: number;
  height_m: number;
  base_price: number;
  price_per_m2: number;
  event_multiplier: number;
  round_step: number;
  default_pitch: string;
  default_cabinet_side_m: number;
  preview_path: string | null;
  updated_at: string;
}

export interface DbPitchConfigRow {
  pitch: string;
  label: string;
  pixels_per_cabinet: number;
  cabinet_side_m: number;
  weight_min_kg: number;
  weight_max_kg: number;
  max_power_w: number;
  average_power_w: number;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
}

// ── Mappers ──────────────────────────────────────────────────────────────────

const getDefaultPreviewPath = (slug: string): string =>
  VISUAL_LED_PRESETS.find((p) => p.slug === slug)?.preview ?? `/visual-led-presets/${slug}.jpg`;

export function dbPresetToPreset(row: DbPresetRow): VisualLedPreset {
  const preview = row.preview_path ?? getDefaultPreviewPath(row.slug);
  return {
    slug: row.slug as VisualLedPreset['slug'],
    title: { ru: row.name_ru, en: row.name_en },
    description: { ru: row.description_ru, en: row.description_en },
    areaM2: Number(row.area_m2),
    widthM: Number(row.width_m),
    heightM: Number(row.height_m),
    basePrice: Number(row.base_price),
    pricePerM2: Number(row.price_per_m2),
    eventMultiplier: Number(row.event_multiplier),
    roundStep: Number(row.round_step),
    preview,
    background: preview,
    defaultPitch: row.default_pitch,
    defaultCabinetSideM: Number(row.default_cabinet_side_m),
    naturalWidth: PRESET_NATURAL_WIDTH,
    naturalHeight: PRESET_NATURAL_HEIGHT,
  };
}

// ── Public read queries (used by visualizer + pricing) ───────────────────────

export async function fetchActivePresets(): Promise<DbPresetRow[]> {
  const { data, error } = await supabase
    .from('visual_led_presets')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchActivePitchConfigs(): Promise<DbPitchConfigRow[]> {
  const { data, error } = await supabase
    .from('visual_led_pitch_config')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

// ── Admin queries (all rows, including inactive) ─────────────────────────────

export async function fetchAllPresets(): Promise<DbPresetRow[]> {
  const { data, error } = await supabase
    .from('visual_led_presets')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllPitchConfigs(): Promise<DbPitchConfigRow[]> {
  const { data, error } = await supabase
    .from('visual_led_pitch_config')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

// ── Admin mutations ──────────────────────────────────────────────────────────

export async function upsertPreset(
  row: Partial<DbPresetRow> & { slug: string },
): Promise<DbPresetRow> {
  const { data, error } = await supabase
    .from('visual_led_presets')
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'slug' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertPitchConfig(
  row: Partial<DbPitchConfigRow> & { pitch: string },
): Promise<DbPitchConfigRow> {
  const { data, error } = await supabase
    .from('visual_led_pitch_config')
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'pitch' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePitchConfig(pitch: string): Promise<void> {
  const { error } = await supabase
    .from('visual_led_pitch_config')
    .delete()
    .eq('pitch', pitch);
  if (error) throw error;
}

// ── Storage helpers ──────────────────────────────────────────────────────────

export async function fetchSharedReports() {
  const { data, error } = await supabase
    .from('shared_reports')
    .select('slug, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<{ slug: string; created_at: string }>;
}

export async function deleteSharedReport(slug: string): Promise<void> {
  const { error } = await supabase
    .from('shared_reports')
    .delete()
    .eq('slug', slug);
  if (error) throw error;
}

export async function fetchSavedProjects() {
  const { data, error } = await supabase
    .from('visual_led_projects')
    .select('id, created_at, state')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; created_at: string; state: Record<string, unknown> }>;
}

export async function deleteSavedProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('visual_led_projects')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
