import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { contacts as baseContacts } from '../data/contacts';

export const useContacts = () => {
  const [items, setItems] = useState(baseContacts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('contacts').select('*').limit(1);

      if (error) {
        console.error('Failed to load contacts:', error);
        setItems(baseContacts);
      } else if (data && data.length > 0) {
        setItems(data[0]);
      } else {
        setItems(baseContacts);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setItems(baseContacts);
    }
    setLoading(false);
  }, []);

  const update = useCallback(
    async (payload: typeof baseContacts) => {
      try {
        const { error } = await supabase
          .from('contacts')
          .upsert({ ...payload, id: 1 })
          .select();

        if (!error) {
          // Перезагружаем данные из базы
          await loadContacts();
        }
      } catch (err) {
        console.error('Failed to save contacts:', err);
      }
    },
    [loadContacts]
  );

  const resetToDefault = useCallback(async () => {
    await supabase.from('contacts').delete();
    await supabase.from('contacts').insert(baseContacts);
    setItems(baseContacts);
  }, []);

  return { contacts: items, loading, update, resetToDefault };
};
