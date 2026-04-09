import type { Locale } from '../../i18n/types';

type SourceLabelParams = {
  adminLocale: Locale;
  contentLocale: Locale;
  fallbackUsed: boolean;
};

export const getAdminSourceLabel = ({ adminLocale, contentLocale, fallbackUsed }: SourceLabelParams): string => {
  if (adminLocale === 'ru') {
    if (contentLocale === 'ru') return 'Источник: RU локаль';
    return fallbackUsed ? 'Источник: RU fallback' : 'Источник: EN локаль';
  }

  if (contentLocale === 'ru') return 'Source: RU locale';
  return fallbackUsed ? 'Source: RU fallback' : 'Source: EN locale';
};

