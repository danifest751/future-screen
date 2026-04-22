import { useMemo } from 'react';
import { getHomePageContent } from '../content/pages/home';
import {
  HOME_CTA_FORM_KEY,
  type HomeCtaFormContent,
  parseHomeCtaForm,
  serializeHomeCtaForm,
} from '../lib/content/homeCtaForm';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const useHomeCtaForm = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo<HomeCtaFormContent>(
    () => getHomePageContent(locale).ctaForm,
    [locale],
  );
  return useSiteSectionJson<HomeCtaFormContent>(
    HOME_CTA_FORM_KEY,
    staticValue,
    parseHomeCtaForm,
    serializeHomeCtaForm,
    locale,
    fallbackToRu,
  );
};
