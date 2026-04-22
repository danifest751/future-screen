import { useMemo } from 'react';
import { getGlobalContent } from '../content/global';
import {
  GLOBAL_CONSENT_KEY,
  type GlobalConsentContent,
  parseGlobalConsent,
  serializeGlobalConsent,
} from '../lib/content/globalConsent';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const useGlobalConsent = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo<GlobalConsentContent>(
    () => getGlobalContent(locale).consentContent,
    [locale],
  );
  return useSiteSectionJson<GlobalConsentContent>(
    GLOBAL_CONSENT_KEY,
    staticValue,
    parseGlobalConsent,
    serializeGlobalConsent,
    locale,
    fallbackToRu,
  );
};
