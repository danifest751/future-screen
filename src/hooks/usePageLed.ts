import { useMemo } from 'react';
import { getLedPageContent } from '../content/pages/led';
import {
  PAGE_LED_KEY,
  type PageLedContent,
  parsePageLed,
  serializePageLed,
} from '../lib/content/pageLed';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const usePageLed = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo(
    () => getLedPageContent(locale) as PageLedContent,
    [locale],
  );
  return useSiteSectionJson<PageLedContent>(
    PAGE_LED_KEY,
    staticValue,
    parsePageLed,
    serializePageLed,
    locale,
    fallbackToRu,
  );
};
