/**
 * React Query hooks для работы с лидами.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
      // PR #5b: soft-delete — hide rows where deleted_at IS NOT NULL.
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .is('deleted_at', null)
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

/**
 * Очистить все лиды (soft-delete).
 *
 * PR #5b: was a hard DELETE; now marks deleted_at so entries stay
 * recoverable and audit-traceable. Only admins can UPDATE leads under
 * the new RLS, which matches the admin-only gating on /admin/leads.
 */
export function useClearLeadsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('leads')
        .update({ deleted_at: new Date().toISOString() })
        .is('deleted_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

/**
 * Отметить все активные заявки как прочитанные.
 */
export function useMarkAllLeadsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('leads')
        .update({ read_at: new Date().toISOString() })
        .is('deleted_at', null)
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

/**
 * Отметить одну заявку как прочитанную.
 */
export function useMarkLeadReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

/**
 * Удалить одну заявку по id (soft-delete).
 */
export function useDeleteLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}
