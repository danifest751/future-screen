import { useMemo } from 'react';
import { getRentPageContent } from '../content/pages/rent';
import {
  PAGE_RENT_KEY,
  type PageRentContent,
  parsePageRent,
  serializePageRent,
} from '../lib/content/pageRent';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const usePageRent = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo(
    () => getRentPageContent(locale) as PageRentContent,
    [locale],
  );
  return useSiteSectionJson<PageRentContent>(
    PAGE_RENT_KEY,
    staticValue,
    parsePageRent,
    serializePageRent,
    locale,
    fallbackToRu,
  );
};
