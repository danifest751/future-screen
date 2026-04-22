import { useMemo } from 'react';
import { getConsultPageContent } from '../content/pages/consult';
import {
  PAGE_CONSULT_KEY,
  type PageConsultContent,
  parsePageConsult,
  serializePageConsult,
} from '../lib/content/pageConsult';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const usePageConsult = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo<PageConsultContent>(
    () => getConsultPageContent(locale) as PageConsultContent,
    [locale],
  );
  return useSiteSectionJson<PageConsultContent>(
    PAGE_CONSULT_KEY,
    staticValue,
    parsePageConsult,
    serializePageConsult,
    locale,
    fallbackToRu,
  );
};
