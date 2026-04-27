import { useQuery } from '@tanstack/react-query';
import {
  fetchActivePresets,
  fetchActivePitchConfigs,
  dbPresetToPreset,
  type DbPitchConfigRow,
} from '../services/visualLedConfig';
import { VISUAL_LED_PRESETS, type VisualLedPreset } from '../lib/visualLed/presets';
import { PIXELS_PER_CABINET } from '../lib/visualLed/types';
import { FALLBACK_PITCH_CONFIGS, type PitchConfig } from '../lib/visualLed/pitchConfig';

export type { PitchConfig };

const QUERY_KEYS = {
  presets: ['visualLedConfig', 'presets'] as const,
  pitchConfigs: ['visualLedConfig', 'pitchConfigs'] as const,
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

/**
 * Loads presets and pitch configs from Supabase with automatic fallback to
 * hardcoded constants when the DB is unreachable (e.g. during local dev
 * without credentials, or a transient network failure).
 *
 * staleTime is long (5 min) — this data rarely changes and we don't want
 * a re-fetch on every editor interaction.
 */
export function useVisualLedConfig(): {
  presets: readonly VisualLedPreset[];
  pitchConfigs: readonly PitchConfig[];
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

  const presets: readonly VisualLedPreset[] =
    presetsQuery.data && presetsQuery.data.length > 0
      ? presetsQuery.data.map(dbPresetToPreset)
      : VISUAL_LED_PRESETS;

  const pitchConfigs: readonly PitchConfig[] =
    pitchQuery.data && pitchQuery.data.length > 0
      ? pitchQuery.data.map(mapPitchRow)
      : FALLBACK_PITCH_CONFIGS;

  // Sync dynamic pitch data into the global PIXELS_PER_CABINET lookup so
  // cabinet math functions (getCabinetStats, getPixelsPerCabinetSide) that
  // are called outside of React still have the latest values.
  if (pitchQuery.data && pitchQuery.data.length > 0) {
    for (const row of pitchQuery.data) {
      PIXELS_PER_CABINET[row.pitch] = row.pixels_per_cabinet;
    }
  }

  return {
    presets,
    pitchConfigs,
    isLoading: presetsQuery.isLoading || pitchQuery.isLoading,
  };
}
