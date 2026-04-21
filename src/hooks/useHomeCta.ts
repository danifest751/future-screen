import { useMemo } from 'react';
import { getHomePageContent } from '../content/pages/home';
import {
  HOME_CTA_KEY,
  type HomeCtaContent,
  parseHomeCta,
  serializeHomeCta,
} from '../lib/content/homeCta';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const useHomeCta = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo(
    () => getHomePageContent(locale).ctaSection as HomeCtaContent,
    [locale],
  );
  return useSiteSectionJson<HomeCtaContent>(
    HOME_CTA_KEY,
    staticValue,
    parseHomeCta,
    serializeHomeCta,
    locale,
    fallbackToRu,
  );
};
