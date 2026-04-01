import { useContactsQuery, useUpdateContactsMutation, useResetContactsMutation } from '../queries';
import { mapContactsFromDB } from '../lib/mappers';

export const useContacts = () => {
  const { data: contactsRaw, isLoading, error } = useContactsQuery();
  const updateMutation = useUpdateContactsMutation();
  const resetMutation = useResetContactsMutation();

  const contacts = contactsRaw ? mapContactsFromDB(contactsRaw) : null;

  const update = async (payload: { phones: string[]; emails: string[]; address: string; workingHours: string }) => {
    try {
      if (!contacts?.id) return false;
      await updateMutation.mutateAsync({
        id: contacts.id,
        phones: payload.phones,
        emails: payload.emails,
        address: payload.address,
        working_hours: payload.workingHours,
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
