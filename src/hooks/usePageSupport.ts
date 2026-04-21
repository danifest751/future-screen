import { useMemo } from 'react';
import { getSupportPageContent } from '../content/pages/support';
import {
  PAGE_SUPPORT_KEY,
  type PageSupportContent,
  parsePageSupport,
  serializePageSupport,
} from '../lib/content/pageSupport';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const usePageSupport = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo(
    () => getSupportPageContent(locale) as PageSupportContent,
    [locale],
  );
  return useSiteSectionJson<PageSupportContent>(
    PAGE_SUPPORT_KEY,
    staticValue,
    parsePageSupport,
    serializePageSupport,
    locale,
    fallbackToRu,
  );
};
