/**
 * React Query hooks для работы с лидами.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from './keys';
import type { Database } from '../lib/database.types';

type LeadRow = Database['public']['Tables']['leads']['Row'];

export type LeadQueryOptions = {
  limit?: number;
  offset?: number;
};

const clampLimit = (value: number | undefined, fallback: number) =>
  Math.min(Math.max(value ?? fallback, 1), 500);

/**
 * Получить страницу лидов.
 */
export function useLeadsQuery(options: LeadQueryOptions = {}) {
  const limit = clampLimit(options.limit, 200);
  const offset = Math.max(options.offset ?? 0, 0);

  return useQuery({
    queryKey: queryKeys.leads.list(limit, offset),
    queryFn: async () => {
      // PR #5b: soft-delete — hide rows where deleted_at IS NOT NULL.
      const { data, error, count } = await supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return {
        items: data as LeadRow[],
        total: count ?? data?.length ?? 0,
        limit,
        offset,
      };
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
