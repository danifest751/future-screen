/**
 * React Query hooks для работы с лидами.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from './keys';
import type { Database } from '../lib/database.types';

type LeadRow = Database['public']['Tables']['leads']['Row'];

/**
 * Получить все лиды.
 */
export function useLeadsQuery() {
  return useQuery({
    queryKey: queryKeys.leads.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LeadRow[];
    },
  });
}

/**
 * Инвалидировать кеш лидов (для использования после мутаций).
 */
export function useInvalidateLeads() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
  };
}
