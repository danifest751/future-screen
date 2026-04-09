import type { Locale } from '../../i18n/types';

const ru = {
  title: 'Используется fallback из русской версии',
};

const en: typeof ru = {
  title: 'Using RU fallback',
};

const fallbackDotContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getFallbackDotContent = (locale: Locale) => fallbackDotContentByLocale[locale];

