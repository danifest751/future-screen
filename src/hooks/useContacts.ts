import { useContactsQuery, useUpdateContactsMutation, useResetContactsMutation } from '../queries';
import { mapContactsFromDB, mapContactsToDB } from '../lib/mappers';
import type { Locale } from '../i18n/types';

export const useContacts = (locale: Locale = 'ru') => {
  const { data: contactsRaw, isLoading, error } = useContactsQuery(locale);
  const updateMutation = useUpdateContactsMutation(locale);
  const resetMutation = useResetContactsMutation();

  const contacts = contactsRaw ? mapContactsFromDB(contactsRaw, locale) : null;
  const row = contactsRaw?.[0];
  const hasText = (value: string | null | undefined): boolean => typeof value === 'string' && value.trim().length > 0;
  const fallbackUsed =
    locale === 'en' &&
    !!row &&
    ((hasText(row.address) && !hasText(row.address_en)) ||
      (hasText(row.working_hours) && !hasText(row.working_hours_en)));

  const update = async (payload: { phones: string[]; emails: string[]; address: string; workingHours: string }) => {
    try {
      if (!contacts?.id) return false;
      const dbPayload = mapContactsToDB(payload, locale);
      await updateMutation.mutateAsync({
        id: contacts.id,
        ...dbPayload,
      });
      return true;
    } catch {
      return false;
    }
  };

  const resetToDefault = async () => {
    try {
      await resetMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  return {
    contacts,
    fallbackUsed,
    loading: isLoading,
    error: error?.message ?? null,
    update,
    resetToDefault,
  };
};
