import { useMemo } from 'react';
import { getGlobalContent } from '../content/global';
import {
  GLOBAL_REQUEST_FORM_KEY,
  type GlobalRequestFormContent,
  parseGlobalRequestForm,
  serializeGlobalRequestForm,
} from '../lib/content/globalRequestForm';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const useGlobalRequestForm = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo<GlobalRequestFormContent>(
    () => getGlobalContent(locale).requestFormContent,
    [locale],
  );
  return useSiteSectionJson<GlobalRequestFormContent>(
    GLOBAL_REQUEST_FORM_KEY,
    staticValue,
    parseGlobalRequestForm,
    serializeGlobalRequestForm,
    locale,
    fallbackToRu,
  );
};
