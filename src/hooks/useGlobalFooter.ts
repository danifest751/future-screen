import { useMemo } from 'react';
import { getGlobalContent } from '../content/global';
import {
  GLOBAL_FOOTER_KEY,
  type GlobalFooterContent,
  parseGlobalFooter,
  serializeGlobalFooter,
} from '../lib/content/globalFooter';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const useGlobalFooter = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo<GlobalFooterContent>(
    () => getGlobalContent(locale).footerContent,
    [locale],
  );
  return useSiteSectionJson<GlobalFooterContent>(
    GLOBAL_FOOTER_KEY,
    staticValue,
    parseGlobalFooter,
    serializeGlobalFooter,
    locale,
    fallbackToRu,
  );
};
