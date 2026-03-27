export interface PitchOption {
  label: string;
  value: number;
  minDistance: number;
  maxDistance: number;
  description: string;
  stockArea?: number; // м² на складе
}

export interface ScreenSizePreset {
  label: string;
  width: number;
  height: number;
}

export interface CalculatorConfig {
  pitchOptions: PitchOption[];
  sizePresets: ScreenSizePreset[];
}

export const defaultCalculatorConfig: CalculatorConfig = {
  pitchOptions: [
    { label: 'P2.6', value: 2.6, minDistance: 0, maxDistance: 3, description: 'Близкий просмотр, презентации, конференции', stockArea: 150 },
    { label: 'P3.9', value: 3.9, minDistance: 3, maxDistance: 6, description: 'Универсально, сцена/зал', stockArea: 200 },
    { label: 'P5.9', value: 5.9, minDistance: 6, maxDistance: 10, description: 'Большие залы', stockArea: 100 },
    { label: 'P8', value: 8, minDistance: 10, maxDistance: 20, description: 'Улица, большие дистанции', stockArea: 80 },
    { label: 'P10', value: 10, minDistance: 20, maxDistance: Infinity, description: 'Улица, очень большие дистанции', stockArea: 60 },
  ],
  sizePresets: [
    { label: '16:9 — 4.0 × 2.25 м', width: 4, height: 2.25 },
    { label: '16:9 — 5.0 × 2.8 м', width: 5, height: 2.8 },
    { label: 'Широкий 3:1 — 9 × 3 м', width: 9, height: 3 },
    { label: 'Компактный 4 × 2 м', width: 4, height: 2 },
  ],
};

export const pitchOptions = defaultCalculatorConfig.pitchOptions;

export type EventType = 'conference' | 'concert' | 'exhibition' | 'sport' | 'corporate' | 'other';
export type Location = 'indoor' | 'outdoor';
export type Purpose = 'presentation' | 'video' | 'broadcast' | 'branding';
export type InstallType = 'hanging' | 'floor' | 'unknown';

export const eventTypes: { value: EventType; label: string }[] = [
  { value: 'conference', label: 'Конференция / форум' },
  { value: 'concert', label: 'Концерт / шоу' },
  { value: 'exhibition', label: 'Выставка / стенд' },
  { value: 'sport', label: 'Спорт / трансляция' },
  { value: 'corporate', label: 'Презентация / корпоратив' },
  { value: 'other', label: 'Другое' },
];

export const locations: { value: Location; label: string }[] = [
  { value: 'indoor', label: 'В помещении' },
  { value: 'outdoor', label: 'На улице' },
];

export const audiencePresets = [
  { label: 'до 100', value: 80 },
  { label: '100–300', value: 200 },
  { label: '300–1 000', value: 600 },
  { label: '1 000+', value: 1500 },
];

export const purposes: { value: Purpose; label: string; hint: string }[] = [
  { value: 'presentation', label: 'Презентации (текст важен)', hint: 'Мельче шаг пикселя, больше высота' },
  { value: 'video', label: 'Видео / шоу', hint: 'Стандартный расчёт' },
  { value: 'broadcast', label: 'Трансляция', hint: 'Стандартный расчёт' },
  { value: 'branding', label: 'Брендинг / фон', hint: 'Крупнее шаг, меньше высота' },
];

export const installTypes: { value: InstallType; label: string }[] = [
  { value: 'hanging', label: 'Подвес' },
  { value: 'floor', label: 'На полу / стойки' },
  { value: 'unknown', label: 'Не знаю' },
];

export const heightDivisors: Record<Purpose, number> = {
  presentation: 5,
  video: 6,
  broadcast: 6,
  branding: 7,
};

export const aspectRatios: Record<EventType, number> = {
  conference: 16 / 9,
  concert: 3,
  exhibition: 16 / 9,
  sport: 16 / 9,
  corporate: 16 / 9,
  other: 16 / 9,
};

export const powerPerM2 = {
  avgMin: 0.2,
  avgMax: 0.4,
  peakMin: 0.6,
  peakMax: 0.9,
};

export interface CalcInputs {
  eventType: EventType;
  location: Location;
  audience: number;
  distanceKnown: boolean;
  distance: number;
  purpose: Purpose;
  stageWidth: number | null;
  maxHeight: number | null;
  installType: InstallType;
}

export interface CalcResult {
  distance: number;
  height: number;
  width: number;
  area: number;
  pitch: typeof pitchOptions[number];
  installRecommendation: string;
  powerAvg: string;
  powerPeak: string;
  warnings: string[];
  explanations: string[];
}
