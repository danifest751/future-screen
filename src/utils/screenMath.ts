import { screenMathContent } from '../content/system/screenMath';

export type Purpose = 'video' | 'presentation' | 'branding';
export type EventType = 'conference' | 'concert' | 'corporate' | 'exhibition' | 'festival';
export type Location = 'indoor' | 'outdoor';

export type PitchOption = {
  label: string;
  value: number;
  minDistance: number;
  maxDistance: number;
  description: string;
  stockArea?: number;
};

export type CalcInputs = {
  eventType: EventType;
  location: Location;
  audience: number;
  distanceKnown: boolean;
  distance: number;
  purpose: Purpose;
  stageWidth: number | null;
  maxHeight: number | null;
  installType: 'unknown' | 'hanging' | 'floor';
};

export type CalcResult = {
  distance: number;
  height: number;
  width: number;
  area: number;
  pitch: PitchOption;
  installRecommendation: string;
  powerAvg: string;
  powerPeak: string;
  warnings: string[];
  explanations: string[];
};

export const pitchOptions: PitchOption[] = [
  { label: 'P2.6', value: 2.6, minDistance: 2, maxDistance: 5, description: screenMathContent.pitchDescriptions.p26 },
  { label: 'P3.9', value: 3.9, minDistance: 3, maxDistance: 8, description: screenMathContent.pitchDescriptions.p39 },
  { label: 'P4.8', value: 4.8, minDistance: 4, maxDistance: 12, description: screenMathContent.pitchDescriptions.p48 },
  { label: 'P6.9', value: 6.9, minDistance: 6, maxDistance: 18, description: screenMathContent.pitchDescriptions.p69 },
  { label: 'P8.9', value: 8.9, minDistance: 8, maxDistance: 25, description: screenMathContent.pitchDescriptions.p89 },
];

export const heightDivisors: Record<Purpose, number> = {
  video: 6,
  presentation: 5,
  branding: 7,
};

export const aspectRatios: Record<EventType, number> = {
  conference: 16 / 9,
  concert: 3,
  corporate: 16 / 9,
  exhibition: 16 / 9,
  festival: 21 / 9,
};

export const powerPerM2 = {
  avgMin: 0.3,
  avgMax: 0.5,
  peakMax: 1.0,
};

export function estimateDistance(audience: number): number {
  return Math.sqrt(audience) * 2;
}

export function recommendHeight(distance: number, purpose: Purpose): number {
  const divisor = heightDivisors[purpose];
  const raw = distance / divisor;
  return Math.round(raw * 2) / 2;
}

export function recommendWidth(height: number, eventType: EventType, stageWidth: number | null): number {
  const ratio = aspectRatios[eventType];
  let raw = height * ratio;
  if (stageWidth && raw > stageWidth) {
    raw = stageWidth;
  }
  return Math.round(raw * 2) / 2;
}

export function selectPitch(distance: number, purpose: Purpose, location: Location, options: PitchOption[] = pitchOptions) {
  const inStock = options.filter((pitch) => pitch.stockArea == null || pitch.stockArea > 0);
  const pool = inStock.length > 0 ? inStock : options;

  let candidates = pool.filter((pitch) => distance >= pitch.minDistance && distance < pitch.maxDistance);

  if (candidates.length === 0) {
    candidates = [pool[pool.length - 1]];
  }

  let selected = candidates[0];

  if (purpose === 'presentation') {
    const index = pool.indexOf(selected);
    if (index > 0) selected = pool[index - 1];
  }

  if (purpose === 'branding') {
    const index = pool.indexOf(selected);
    if (index < pool.length - 1) selected = pool[index + 1];
  }

  if (location === 'outdoor' && selected.value < 3.9) {
    selected = pool.find((pitch) => pitch.value >= 3.9) ?? selected;
  }

  return selected;
}

export function recommendInstall(location: Location, installType: CalcInputs['installType']): string {
  if (location === 'outdoor') {
    return screenMathContent.install.outdoor;
  }
  if (installType === 'hanging') return screenMathContent.install.hanging;
  if (installType === 'floor') return screenMathContent.install.floor;
  return screenMathContent.install.fallback;
}

export function estimatePower(area: number) {
  const avgMin = (area * powerPerM2.avgMin).toFixed(1);
  const avgMax = (area * powerPerM2.avgMax).toFixed(1);
  const peakMax = (area * powerPerM2.peakMax).toFixed(1);

  return {
    avg: `${avgMin}-${avgMax} ${screenMathContent.power.avgUnit}`,
    peak: `${screenMathContent.power.peakPrefix} ${peakMax} ${screenMathContent.power.avgUnit}`,
  };
}

export function calculate(inputs: CalcInputs, customPitchOptions?: PitchOption[]): CalcResult {
  const warnings: string[] = [];
  const explanations: string[] = [];

  let distance = inputs.distance;
  if (!inputs.distanceKnown || !distance) {
    distance = estimateDistance(inputs.audience);
    explanations.push(screenMathContent.explanations.estimatedDistance(distance));
  }
  distance = Math.max(distance, 2);

  let height = recommendHeight(distance, inputs.purpose);
  if (inputs.maxHeight && height > inputs.maxHeight) {
    height = Math.round(inputs.maxHeight * 2) / 2;
    warnings.push(screenMathContent.warnings.maxHeight(inputs.maxHeight));
  }
  height = Math.max(height, 1);
  explanations.push(screenMathContent.explanations.selectedHeight(distance, heightDivisors[inputs.purpose]));

  let width = recommendWidth(height, inputs.eventType, inputs.stageWidth);
  if (inputs.stageWidth && width < recommendWidth(height, inputs.eventType, null)) {
    warnings.push(screenMathContent.warnings.stageWidth(inputs.stageWidth));
  }
  width = Math.max(width, 1);

  let area = Math.round(width * height * 10) / 10;
  const pitch = selectPitch(distance, inputs.purpose, inputs.location, customPitchOptions ?? pitchOptions);

  const stock = pitch.stockArea;
  if (stock != null && stock > 0 && area > stock) {
    const ratio = width / height;
    const newArea = stock;
    const newHeight = Math.floor(Math.sqrt(newArea / ratio) * 2) / 2;
    const newWidth = Math.floor(newHeight * ratio * 2) / 2;

    warnings.push(screenMathContent.warnings.stockReduced(stock, pitch.label, width, height, newWidth, newHeight));
    width = Math.max(newWidth, 1);
    height = Math.max(newHeight, 1);
    area = Math.round(width * height * 10) / 10;
  }

  if (distance < pitch.value * 1.2) {
    warnings.push(screenMathContent.warnings.visiblePixels(distance, pitch.label));
  }

  if (inputs.location === 'outdoor' && distance < 4) {
    warnings.push(screenMathContent.warnings.outdoorClose);
  }

  explanations.push(screenMathContent.explanations.selectedPitch(pitch.label, distance));
  if (stock != null && stock > 0) {
    explanations.push(screenMathContent.explanations.stockPitch(stock, pitch.label));
  }

  const installRecommendation = recommendInstall(inputs.location, inputs.installType);
  const power = estimatePower(area);

  return {
    distance: Math.round(distance * 10) / 10,
    height,
    width,
    area,
    pitch,
    installRecommendation,
    powerAvg: power.avg,
    powerPeak: power.peak,
    warnings,
    explanations,
  };
}
