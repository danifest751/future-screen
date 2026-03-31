import { useEffect } from 'react';
import { useAdminData } from '../context/AdminDataContext';

export const useContacts = () => {
  const { contacts, ensureContacts, updateContacts, resetContacts } = useAdminData();

  useEffect(() => {
    void ensureContacts();
  }, [ensureContacts]);

  return {
    contacts: contacts.items,
    loading: contacts.loading,
    error: contacts.error,
    update: updateContacts,
    resetToDefault: resetContacts,
  };
};
