import { useMemo } from 'react';
import { getHomePageContent } from '../content/pages/home';
import {
  HOME_PROCESS_KEY,
  type HomeProcessContent,
  parseHomeProcess,
  serializeHomeProcess,
} from '../lib/content/homeProcess';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const useHomeProcess = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo(
    () => getHomePageContent(locale).processSection as HomeProcessContent,
    [locale],
  );
  return useSiteSectionJson<HomeProcessContent>(
    HOME_PROCESS_KEY,
    staticValue,
    parseHomeProcess,
    serializeHomeProcess,
    locale,
    fallbackToRu,
  );
};
