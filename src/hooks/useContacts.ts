import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { contacts as baseContacts } from '../data/contacts';

type ContactsData = typeof baseContacts;

// Внутренний тип для хранения реального ID из базы
type ContactsWithId = ContactsData & { id?: number };

type ContactsRow = {
  id?: number;
  phones?: string[];
  emails?: string[];
  address?: string;
  working_hours?: string;
};

const getErrorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Unknown error');

const mapContactsFromDB = (row: ContactsRow): ContactsWithId => ({
  id: row.id,
  phones: row.phones || [],
  emails: row.emails || [],
  address: row.address || '',
  workingHours: row.working_hours || '',
});

const mapContactsToDB = (contacts: ContactsWithId) => {
  const result: Record<string, unknown> = {
    phones: contacts.phones,
    emails: contacts.emails,
    address: contacts.address,
    working_hours: contacts.workingHours,
  };
  // Добавляем ID только если он есть (чтобы обновить конкретную строку)
  if (contacts.id) {
    result.id = contacts.id;
  }
  return result;
};

export const useContacts = () => {
  const [items, setItems] = useState<ContactsWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    try {
      // Сортируем по ID, чтобы всегда брать самую новую или стабильную запись
      const { data, error } = await supabase.from('contacts').select('*').order('id', { ascending: true }).limit(1);

      if (error) {
        console.error('Failed to load contacts:', error);
        setError(error.message);
        setItems(null);
      } else if (data && data.length > 0) {
        setItems(mapContactsFromDB(data[0]));
        setError(null);
      } else {
        setItems(null);
        setError(null);
      }
    } catch (err: unknown) {
      console.error('Failed to load contacts:', err);
      setError(getErrorMessage(err));
      setItems(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const update = useCallback(
    async (payload: ContactsData) => {
      try {
        // Подмешиваем существующий ID (если он есть), чтобы upsert сработал как update
        const nextPayload: ContactsWithId = { ...payload, id: items?.id };
        const mappedData = mapContactsToDB(nextPayload);

        const { error } = await supabase
          .from('contacts')
          .upsert(mappedData)
          .select();

        if (error) {
          console.error('Failed to save contacts:', error);
          setError(error.message);
          return false;
        }
        await loadContacts();
        return true;
      } catch (err: unknown) {
        console.error('Failed to save contacts:', err);
        setError(getErrorMessage(err));
        return false;
      }
    },
    [loadContacts, items?.id]
  );

  const resetToDefault = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await supabase.from('contacts').delete().neq('id', 0); // Delete all
      const { error } = await supabase.from('contacts').insert(mapContactsToDB(baseContacts));
      if (error) throw error;
      await loadContacts();
    } catch (err: unknown) {
      console.error('Failed to reset contacts:', err);
      setError(getErrorMessage(err));
    }
    setLoading(false);
  }, [loadContacts]);

  return { contacts: items || baseContacts, loading, error, update, resetToDefault };
};
