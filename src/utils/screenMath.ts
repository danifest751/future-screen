import {
  pitchOptions,
  heightDivisors,
  aspectRatios,
  powerPerM2,
  type CalcInputs,
  type CalcResult,
  type Purpose,
  type EventType,
  type Location,
  type PitchOption,
} from '../data/calculatorConfig';

export function estimateDistance(audience: number): number {
  return Math.sqrt(audience) * 2;
}

export function recommendHeight(distance: number, purpose: Purpose): number {
  const divisor = heightDivisors[purpose];
  const raw = distance / divisor;
  return Math.round(raw * 2) / 2; // округление до 0.5 м
}

export function recommendWidth(height: number, eventType: EventType, stageWidth: number | null): number {
  const ratio = aspectRatios[eventType];
  let raw = height * ratio;
  if (stageWidth && raw > stageWidth) {
    raw = stageWidth;
  }
  return Math.round(raw * 2) / 2; // округление до 0.5 м
}

export function selectPitch(distance: number, purpose: Purpose, location: Location, options: PitchOption[] = pitchOptions) {
  // Только pitch с наличием на складе (stockArea > 0 или не задан)
  const inStock = options.filter((p) => p.stockArea == null || p.stockArea > 0);
  const pool = inStock.length > 0 ? inStock : options; // fallback на все, если склад пуст

  let candidates = pool.filter(
    (p) => distance >= p.minDistance && distance < p.maxDistance
  );

  if (candidates.length === 0) {
    candidates = [pool[pool.length - 1]];
  }

  let selected = candidates[0];

  // Для презентаций — на 1 уровень мельче (если возможно)
  if (purpose === 'presentation') {
    const idx = pool.indexOf(selected);
    if (idx > 0) selected = pool[idx - 1];
  }

  // Для брендинга — на 1 уровень крупнее (если возможно)
  if (purpose === 'branding') {
    const idx = pool.indexOf(selected);
    if (idx < pool.length - 1) selected = pool[idx + 1];
  }

  // Улица — минимум P3.9
  if (location === 'outdoor' && selected.value < 3.9) {
    selected = pool.find((p) => p.value >= 3.9) ?? selected;
  }

  return selected;
}

export function recommendInstall(location: Location, installType: CalcInputs['installType']): string {
  if (location === 'outdoor') {
    return 'Уличная конструкция / ферма + балласт';
  }
  if (installType === 'hanging') return 'Подвес';
  if (installType === 'floor') return 'Напольная / на стойках / рама';
  return 'Напольная / на стойках (уточним по площадке)';
}

export function estimatePower(area: number) {
  const avgMin = (area * powerPerM2.avgMin).toFixed(1);
  const avgMax = (area * powerPerM2.avgMax).toFixed(1);
  const peakMax = (area * powerPerM2.peakMax).toFixed(1);
  return {
    avg: `${avgMin}–${avgMax} кВт`,
    peak: `до ${peakMax} кВт`,
  };
}

export function calculate(inputs: CalcInputs, customPitchOptions?: PitchOption[]): CalcResult {
  const warnings: string[] = [];
  const explanations: string[] = [];

  // 1. Дистанция
  let distance = inputs.distance;
  if (!inputs.distanceKnown || !distance) {
    distance = estimateDistance(inputs.audience);
    explanations.push(`Дистанция оценена по количеству зрителей (~${Math.round(distance)} м)`);
  }
  distance = Math.max(distance, 2);

  // 2. Высота
  let height = recommendHeight(distance, inputs.purpose);
  if (inputs.maxHeight && height > inputs.maxHeight) {
    height = Math.round(inputs.maxHeight * 2) / 2;
    warnings.push(`Высота ограничена потолком (${inputs.maxHeight} м), рекомендуемая была больше`);
  }
  height = Math.max(height, 1);
  explanations.push(`Высоту подобрали по расстоянию до последнего ряда (${Math.round(distance)} м ÷ ${heightDivisors[inputs.purpose]})`);

  // 3. Ширина
  let width = recommendWidth(height, inputs.eventType, inputs.stageWidth);
  if (inputs.stageWidth && width < recommendWidth(height, inputs.eventType, null)) {
    warnings.push(`Экран уже расчётного — ограничен шириной сцены (${inputs.stageWidth} м)`);
  }
  width = Math.max(width, 1);

  // 4. Площадь
  let area = Math.round(width * height * 10) / 10;

  // 5. Pitch
  const pitch = selectPitch(distance, inputs.purpose, inputs.location, customPitchOptions ?? pitchOptions);

  // 5a. Ограничение по складу
  const stock = pitch.stockArea;
  if (stock != null && stock > 0 && area > stock) {
    const ratio = width / height;
    const newArea = stock;
    const newHeight = Math.floor(Math.sqrt(newArea / ratio) * 2) / 2; // округление вниз до 0.5 м
    const newWidth = Math.floor((newHeight * ratio) * 2) / 2;
    warnings.push(`На складе ${stock} м² экрана ${pitch.label} — размер уменьшен с ${width}×${height} до ${newWidth}×${newHeight} м`);
    width = Math.max(newWidth, 1);
    height = Math.max(newHeight, 1);
    area = Math.round(width * height * 10) / 10;
  }

  if (distance < pitch.value * 1.2) {
    warnings.push(`При дистанции ${Math.round(distance)} м и шаге ${pitch.label} могут быть видны пиксели`);
  }
  if (inputs.location === 'outdoor' && distance < 4) {
    warnings.push('Улица + близкая дистанция — нужно уточнить шаг и яркость');
  }

  explanations.push(`Шаг пикселя ${pitch.label} выбран для комфортного просмотра с ${Math.round(distance)} м`);
  if (stock != null && stock > 0) {
    explanations.push(`На складе ${stock} м² экрана ${pitch.label}`);
  }

  // 6. Установка
  const installRecommendation = recommendInstall(inputs.location, inputs.installType);

  // 7. Мощность
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
