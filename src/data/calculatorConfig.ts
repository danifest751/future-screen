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
  screenProducts: ScreenProduct[];
  costParams: CostParams;
}

export interface ScreenProduct {
  id: string;
  label: string;
  location: Location;
  pitch: number;
  cabinetW: number;
  cabinetH: number;
  powerWPerM2: number;
  pricePerM2: number;
  availableArea?: number; // м² доступно
}

export interface CostParams {
  assemblyCostPerM2: number;
  technicianPerDay: number;
  engineerPerDay: number;
  discountFactors: number[]; // множители по дням (1й день=1, 2й=0.5...)
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
  screenProducts: [
    {
      id: 'outdoor-p3.9',
      label: 'Улица P3.9 (кабинет 1×0.5)',
      location: 'outdoor',
      pitch: 3.9,
      cabinetW: 1,
      cabinetH: 0.5,
      powerWPerM2: 700,
      pricePerM2: 6000,
      availableArea: 200,
    },
    {
      id: 'outdoor-p2.6',
      label: 'Улица P2.6 (кабинет 0.5×0.5)',
      location: 'outdoor',
      pitch: 2.6,
      cabinetW: 0.5,
      cabinetH: 0.5,
      powerWPerM2: 700,
      pricePerM2: 7000,
      availableArea: 150,
    },
    {
      id: 'indoor-p1.9',
      label: 'Помещение P1.9 (кабинет 0.5×0.5)',
      location: 'indoor',
      pitch: 1.9,
      cabinetW: 0.5,
      cabinetH: 0.5,
      powerWPerM2: 700,
      pricePerM2: 8500,
      availableArea: 120,
    },
  ],
  costParams: {
    assemblyCostPerM2: 1500,
    technicianPerDay: 8000,
    engineerPerDay: 20000,
    discountFactors: [1, 0.5, 0.4, 0.3],
  },
};

export const pitchOptions = defaultCalculatorConfig.pitchOptions;
export const screenProducts = defaultCalculatorConfig.screenProducts;

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
