import type { Locale } from '../../i18n/types';

const ru = {
  fallbackTitle: 'Политика конфиденциальности',
  fallbackDescription:
    'Политика конфиденциальности временно недоступна. Пожалуйста, попробуйте позже.',
};

const en: typeof ru = {
  fallbackTitle: 'Privacy Policy',
  fallbackDescription:
    'The privacy policy is temporarily unavailable. Please try again later.',
};

const privacyPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getPrivacyPageContent = (locale: Locale) => privacyPageContentByLocale[locale];

export const privacyPageContent = ru;
