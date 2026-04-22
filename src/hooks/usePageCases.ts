import { useMemo } from 'react';
import { getCasesPageContent } from '../content/pages/cases';
import {
  PAGE_CASES_KEY,
  type PageCasesContent,
  parsePageCases,
  serializePageCases,
} from '../lib/content/pageCases';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

// Build the static fallback from the bundled content, converting the
// videoOverlay.many(n) function into a `{count}`-template string.
const buildStatic = (locale: Locale): PageCasesContent => {
  const bundled = getCasesPageContent(locale);
  const sampleOne = bundled.videoOverlay.many(1);
  const manyTemplate = sampleOne.replace(/\b1\b/, '{count}');
  return {
    seo: bundled.seo,
    section: bundled.section,
    videoOverlay: { watch: bundled.videoOverlay.watch, manyTemplate },
    emptyState: bundled.emptyState,
    details: bundled.details,
  };
};

export const usePageCases = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo<PageCasesContent>(() => buildStatic(locale), [locale]);
  return useSiteSectionJson<PageCasesContent>(
    PAGE_CASES_KEY,
    staticValue,
    parsePageCases,
    serializePageCases,
    locale,
    fallbackToRu,
  );
};
