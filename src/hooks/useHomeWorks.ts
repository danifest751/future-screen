import { useMemo } from 'react';
import { getHomePageContent } from '../content/pages/home';
import {
  HOME_WORKS_KEY,
  type HomeWorksContent,
  parseHomeWorks,
  serializeHomeWorks,
} from '../lib/content/homeWorks';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const useHomeWorks = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo(
    () => getHomePageContent(locale).works as HomeWorksContent,
    [locale],
  );
  return useSiteSectionJson<HomeWorksContent>(
    HOME_WORKS_KEY,
    staticValue,
    parseHomeWorks,
    serializeHomeWorks,
    locale,
    fallbackToRu,
  );
};
