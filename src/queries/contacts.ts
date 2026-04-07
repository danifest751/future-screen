/**
 * React Query hooks для работы с контактами.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from './keys';
import type { Database } from '../lib/database.types';
import { contacts as baseContacts } from '../data/contacts';
import type { Locale } from '../i18n/types';

type ContactRow = Database['public']['Tables']['contacts']['Row'];
type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

/**
 * Получить контакты.
 */
export function useContactsQuery(locale: Locale = 'ru') {
  return useQuery({
    queryKey: queryKeys.contacts.all(locale),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      return data as ContactRow[];
    },
  });
}

/**
 * Обновить контакты.
 */
export function useUpdateContactsMutation(locale: Locale = 'ru') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ContactUpdate & { id: number }) => {
      const { id, ...rest } = updates;
      
      // Удаляем id из rest, чтобы он не попал в данные для обновления
      const { id: _, ...dataWithoutId } = rest as Record<string, unknown> & { id?: unknown };
      
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      if (isNaN(numId)) {
        throw new Error(`Invalid contact id: ${id}`);
      }
      
      const { data, error } = await supabase
        .from('contacts')
        .update(dataWithoutId)
        .eq('id', numId)
        .select()
        .single();

      if (error) throw error;
      return data as ContactRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all(locale) });
    },
  });
}

/**
 * Сбросить контакты к дефолтным значениям.
 */
export function useResetContactsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await supabase.from('contacts').delete().neq('id', 0);
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          phones: baseContacts.phones,
          emails: baseContacts.emails,
          address: baseContacts.address,
          working_hours: baseContacts.workingHours,
        })
        .select();
      if (error) throw error;
      return data as ContactRow[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
