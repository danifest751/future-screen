import { useMemo } from 'react';
import { getPricesPageContent } from '../content/pages/prices';
import {
  PAGE_PRICES_KEY,
  type PagePricesContent,
  parsePagePrices,
  serializePagePrices,
} from '../lib/content/pagePrices';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const usePagePrices = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo<PagePricesContent>(
    () => getPricesPageContent(locale) as PagePricesContent,
    [locale],
  );
  return useSiteSectionJson<PagePricesContent>(
    PAGE_PRICES_KEY,
    staticValue,
    parsePagePrices,
    serializePagePrices,
    locale,
    fallbackToRu,
  );
};
