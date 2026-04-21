import { useMemo } from 'react';
import { getHomePageContent } from '../content/pages/home';
import {
  HOME_EVENT_TYPES_KEY,
  type HomeEventTypesContent,
  parseHomeEventTypes,
  serializeHomeEventTypes,
} from '../lib/content/homeEventTypes';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const useHomeEventTypes = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo(
    () => getHomePageContent(locale).eventTypesSection as HomeEventTypesContent,
    [locale],
  );
  return useSiteSectionJson<HomeEventTypesContent>(
    HOME_EVENT_TYPES_KEY,
    staticValue,
    parseHomeEventTypes,
    serializeHomeEventTypes,
    locale,
    fallbackToRu,
  );
};
