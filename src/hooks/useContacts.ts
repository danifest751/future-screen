import { useContactsQuery, useUpdateContactsMutation, useResetContactsMutation } from '../queries';
import { mapContactsFromDB, mapContactsToDB } from '../lib/mappers';

export const useContacts = () => {
  const { data: contactsRaw, isLoading, error } = useContactsQuery();
  const updateMutation = useUpdateContactsMutation();
  const resetMutation = useResetContactsMutation();

  const contacts = contactsRaw ? mapContactsFromDB(contactsRaw) : null;

  const update = async (payload: { phones: string[]; emails: string[]; address: string; workingHours: string }) => {
    try {
      if (!contacts?.id) return false;
      const dbPayload = mapContactsToDB(payload);
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
    loading: isLoading,
    error: error?.message ?? null,
    update,
    resetToDefault,
  };
};
