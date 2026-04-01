/**
 * React Query hooks для работы с контактами.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from './keys';
import type { Database } from '../lib/database.types';
import { contacts as baseContacts } from '../data/contacts';

type ContactRow = Database['public']['Tables']['contacts']['Row'];
type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

/**
 * Получить контакты.
 */
export function useContactsQuery() {
  return useQuery({
    queryKey: queryKeys.contacts.all,
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
export function useUpdateContactsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ContactUpdate & { id: number }) => {
      const { id, ...rest } = updates;
      const { data, error } = await supabase
        .from('contacts')
        .update(rest)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ContactRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}
