/**
 * PitchConfig — the canonical runtime shape for a pixel-pitch spec.
 * Lives here (not in cabinet.ts) to avoid circular imports with the hook.
 */
export interface PitchConfig {
  pitch: string;
  label: string;
  pixelsPerCabinet: number;
  cabinetSideM: number;
  weightMinKg: number;
  weightMaxKg: number;
  maxPowerW: number;
  averagePowerW: number;
}

/** Hardcoded fallback used when the DB is unavailable. */
export const FALLBACK_PITCH_CONFIGS: readonly PitchConfig[] = [
  { pitch: '1.9', label: 'P1.9', pixelsPerCabinet: 256, cabinetSideM: 0.5, weightMinKg: 7,  weightMaxKg: 9,  maxPowerW: 200, averagePowerW: 70  },
  { pitch: '2.6', label: 'P2.6', pixelsPerCabinet: 192, cabinetSideM: 0.5, weightMinKg: 6,  weightMaxKg: 8,  maxPowerW: 160, averagePowerW: 55  },
  { pitch: '3.9', label: 'P3.9', pixelsPerCabinet: 128, cabinetSideM: 0.5, weightMinKg: 7,  weightMaxKg: 9,  maxPowerW: 200, averagePowerW: 65  },
  { pitch: '5.9', label: 'P5.9', pixelsPerCabinet:  84, cabinetSideM: 0.5, weightMinKg: 12, weightMaxKg: 16, maxPowerW: 300, averagePowerW: 100 },
];
