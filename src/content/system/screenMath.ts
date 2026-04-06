export const screenMathContent = {
  pitchDescriptions: {
    p26: 'Премиум, ультра-близкая дистанция',
    p39: 'Универсальный indoor / близкая дистанция',
    p48: 'Средняя дистанция',
    p69: 'Большие залы / дальняя дистанция',
    p89: 'Очень дальняя дистанция',
  },
  install: {
    outdoor: 'Уличная конструкция / ферма + балласт',
    hanging: 'Подвес',
    floor: 'Напольная / на стойках / рама',
    fallback: 'Напольная / на стойках (уточним по площадке)',
  },
  power: {
    avgUnit: 'кВт',
    peakPrefix: 'до',
  },
  explanations: {
    estimatedDistance: (distance: number) =>
      `Дистанция оценена по количеству зрителей (~${Math.round(distance)} м)`,
    selectedHeight: (distance: number, divisor: number) =>
      `Высоту подобрали по расстоянию до последнего ряда (${Math.round(distance)} м ÷ ${divisor})`,
    selectedPitch: (pitchLabel: string, distance: number) =>
      `Шаг пикселя ${pitchLabel} выбран для комфортного просмотра с ${Math.round(distance)} м`,
    stockPitch: (stock: number, pitchLabel: string) =>
      `На складе ${stock} м² экрана ${pitchLabel}`,
  },
  warnings: {
    maxHeight: (maxHeight: number) =>
      `Высота ограничена потолком (${maxHeight} м), рекомендуемая была больше`,
    stageWidth: (stageWidth: number) =>
      `Экран уже расчётного, ограничен шириной сцены (${stageWidth} м)`,
    stockReduced: (
      stock: number,
      pitchLabel: string,
      width: number,
      height: number,
      newWidth: number,
      newHeight: number
    ) =>
      `На складе ${stock} м² экрана ${pitchLabel}, размер уменьшен с ${width}×${height} до ${newWidth}×${newHeight} м`,
    visiblePixels: (distance: number, pitchLabel: string) =>
      `При дистанции ${Math.round(distance)} м и шаге ${pitchLabel} могут быть видны пиксели`,
    outdoorClose: 'Улица + близкая дистанция, нужно уточнить шаг и яркость',
  },
} as const;
