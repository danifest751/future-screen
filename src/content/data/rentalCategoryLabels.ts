import type { Locale } from '../../i18n/types';

type RentalCategoryLabels = {
  name: string;
  shortName?: string;
};

const enBySlug: Record<string, RentalCategoryLabels> = {
  video: { name: 'Video equipment', shortName: 'LED screens and displays' },
  sound: { name: 'Audio equipment', shortName: 'PA systems and microphones' },
  light: { name: 'Lighting equipment', shortName: 'Stage and event lighting' },
  stage: { name: 'Stage structures', shortName: 'Stages and truss systems' },
  instruments: { name: 'Instruments', shortName: 'Musical instruments and backline' },
  computers: { name: 'Computers', shortName: 'PCs and laptops' },
  touchscreens: { name: 'Touchscreens', shortName: 'Interactive touch displays' },
  staff: { name: 'Technical crew', shortName: 'Operators and engineers' },
};

export const getRentalCategoryDisplay = (
  slug: string,
  fallbackName: string,
  fallbackShortName: string,
  locale: Locale
): RentalCategoryLabels => {
  if (locale !== 'en') {
    return { name: fallbackName, shortName: fallbackShortName };
  }

  const entry = enBySlug[slug];
  if (!entry) {
    return { name: fallbackName, shortName: fallbackShortName };
  }

  return {
    name: entry.name,
    shortName: entry.shortName ?? fallbackShortName,
  };
};
