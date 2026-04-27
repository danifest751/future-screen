import { useQuery } from '@tanstack/react-query';
import {
  fetchActivePresets,
  fetchActivePitchConfigs,
  fetchDayDiscounts,
  dbPresetToPreset,
  type DbPitchConfigRow,
  type DbDayDiscountRow,
} from '../services/visualLedConfig';
import { VISUAL_LED_PRESETS, type VisualLedPreset } from '../lib/visualLed/presets';
import { PIXELS_PER_CABINET } from '../lib/visualLed/types';
import { FALLBACK_PITCH_CONFIGS, type PitchConfig } from '../lib/visualLed/pitchConfig';
import { FALLBACK_DAY_DISCOUNTS, type DayDiscount } from '../lib/visualLed/pricing';

export type { PitchConfig, DayDiscount };

const QUERY_KEYS = {
  presets: ['visualLedConfig', 'presets'] as const,
  pitchConfigs: ['visualLedConfig', 'pitchConfigs'] as const,
  dayDiscounts: ['visualLedConfig', 'dayDiscounts'] as const,
};

function mapPitchRow(row: DbPitchConfigRow): PitchConfig {
  return {
    pitch: row.pitch,
    label: row.label,
    pixelsPerCabinet: row.pixels_per_cabinet,
    cabinetSideM: Number(row.cabinet_side_m),
    weightMinKg: Number(row.weight_min_kg),
    weightMaxKg: Number(row.weight_max_kg),
    maxPowerW: row.max_power_w,
    averagePowerW: row.average_power_w,
  };
}

function mapDiscountRow(row: DbDayDiscountRow): DayDiscount {
  return {
    dayNumber: row.day_number,
    discountPercent: Number(row.discount_percent),
    labelRu: row.label_ru,
    isLastTier: row.is_last_tier,
  };
}

/**
 * Loads presets, pitch configs and day-discount tiers from Supabase
 * with automatic fallback to hardcoded constants when the DB is
 * unreachable (local dev, transient error).
 *
 * staleTime is long (5 min) — this config rarely changes.
 */
export function useVisualLedConfig(): {
  presets: readonly VisualLedPreset[];
  pitchConfigs: readonly PitchConfig[];
  dayDiscounts: readonly DayDiscount[];
  isLoading: boolean;
} {
  const presetsQuery = useQuery({
    queryKey: QUERY_KEYS.presets,
    queryFn: fetchActivePresets,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const pitchQuery = useQuery({
    queryKey: QUERY_KEYS.pitchConfigs,
    queryFn: fetchActivePitchConfigs,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const discountsQuery = useQuery({
    queryKey: QUERY_KEYS.dayDiscounts,
    queryFn: fetchDayDiscounts,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const presets: readonly VisualLedPreset[] =
    presetsQuery.data && presetsQuery.data.length > 0
      ? presetsQuery.data.map(dbPresetToPreset)
      : VISUAL_LED_PRESETS;

  const pitchConfigs: readonly PitchConfig[] =
    pitchQuery.data && pitchQuery.data.length > 0
      ? pitchQuery.data.map(mapPitchRow)
      : FALLBACK_PITCH_CONFIGS;

  const dayDiscounts: readonly DayDiscount[] =
    discountsQuery.data && discountsQuery.data.length > 0
      ? discountsQuery.data.map(mapDiscountRow)
      : FALLBACK_DAY_DISCOUNTS;

  // Sync dynamic pitch data into the global PIXELS_PER_CABINET lookup so
  // cabinet math functions called outside React still see the latest values.
  if (pitchQuery.data && pitchQuery.data.length > 0) {
    for (const row of pitchQuery.data) {
      PIXELS_PER_CABINET[row.pitch] = row.pixels_per_cabinet;
    }
  }

  return {
    presets,
    pitchConfigs,
    dayDiscounts,
    isLoading: presetsQuery.isLoading || pitchQuery.isLoading || discountsQuery.isLoading,
  };
}
