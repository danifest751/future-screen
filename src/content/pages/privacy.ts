import type { Locale } from '../../i18n/types';

const ru = {
  fallbackTitle: 'Политика конфиденциальности',
  fallbackDescription:
    'Политика конфиденциальности временно недоступна. Пожалуйста, попробуйте позже.',
} as const;

const en: typeof ru = ru;

const privacyPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getPrivacyPageContent = (locale: Locale) => privacyPageContentByLocale[locale];

export const privacyPageContent = ru;
