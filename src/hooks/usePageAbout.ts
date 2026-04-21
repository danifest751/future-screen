import { useMemo } from 'react';
import { getAboutPageContent } from '../content/pages/about';
import {
  PAGE_ABOUT_KEY,
  type PageAboutContent,
  parsePageAbout,
  serializePageAbout,
} from '../lib/content/pageAbout';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const usePageAbout = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo(
    () => getAboutPageContent(locale) as PageAboutContent,
    [locale],
  );
  return useSiteSectionJson<PageAboutContent>(
    PAGE_ABOUT_KEY,
    staticValue,
    parsePageAbout,
    serializePageAbout,
    locale,
    fallbackToRu,
  );
};
