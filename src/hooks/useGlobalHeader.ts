import { useMemo } from 'react';
import { getGlobalContent } from '../content/global';
import {
  GLOBAL_HEADER_KEY,
  type GlobalHeaderContent,
  parseGlobalHeader,
  serializeGlobalHeader,
} from '../lib/content/globalHeader';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const useGlobalHeader = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo<GlobalHeaderContent>(
    () => getGlobalContent(locale).headerContent,
    [locale],
  );
  return useSiteSectionJson<GlobalHeaderContent>(
    GLOBAL_HEADER_KEY,
    staticValue,
    parseGlobalHeader,
    serializeGlobalHeader,
    locale,
    fallbackToRu,
  );
};
