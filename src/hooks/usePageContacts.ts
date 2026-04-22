import { useMemo } from 'react';
import { getContactsPageContent } from '../content/pages/contacts';
import {
  PAGE_CONTACTS_KEY,
  type PageContactsContent,
  parsePageContacts,
  serializePageContacts,
} from '../lib/content/pageContacts';
import { useSiteSectionJson } from './useSiteSection';
import type { Locale } from '../i18n/types';

export const usePageContacts = (locale: Locale = 'ru', fallbackToRu = true) => {
  const staticValue = useMemo<PageContactsContent>(
    () => getContactsPageContent(locale) as PageContactsContent,
    [locale],
  );
  return useSiteSectionJson<PageContactsContent>(
    PAGE_CONTACTS_KEY,
    staticValue,
    parsePageContacts,
    serializePageContacts,
    locale,
    fallbackToRu,
  );
};
