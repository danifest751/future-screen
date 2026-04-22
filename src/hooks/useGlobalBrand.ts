import { useMemo } from 'react';
import { getGlobalContent } from '../content/global';
import {
  GLOBAL_BRAND_KEY,
  type GlobalBrandContent,
  parseGlobalBrand,
  serializeGlobalBrand,
} from '../lib/content/globalBrand';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const useGlobalBrand = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo<GlobalBrandContent>(
    () => getGlobalContent(locale).brandContent,
    [locale],
  );
  return useSiteSectionJson<GlobalBrandContent>(
    GLOBAL_BRAND_KEY,
    staticValue,
    parseGlobalBrand,
    serializeGlobalBrand,
    locale,
    fallbackToRu,
  );
};
