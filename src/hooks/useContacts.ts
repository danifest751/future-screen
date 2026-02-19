import { useCallback, useEffect, useState } from 'react';
import { contacts as baseContacts } from '../data/contacts';
import { normalizeList } from '../utils/normalizeList';

type Contacts = typeof baseContacts;

const STORAGE_KEY = 'fs_admin_contacts';

export const useContacts = () => {
  const [item, setItem] = useState<Contacts>(baseContacts);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItem(JSON.parse(raw));
    } catch (err) {
      console.error('Failed to load contacts', err);
    }
  }, []);

  const persist = useCallback((next: Contacts) => {
    setItem(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error('Failed to save contacts', err);
    }
  }, []);

  const update = useCallback(
    (payload: Partial<Contacts>) => {
      persist({
        ...item,
        ...payload,
        phones: payload.phones ? normalizeList(payload.phones) : item.phones,
        emails: payload.emails ? normalizeList(payload.emails) : item.emails,
      });
    },
    [item, persist]
  );

  const resetToDefault = useCallback(() => {
    persist(baseContacts);
  }, [persist]);

  return { contacts: item, update, resetToDefault };
};
