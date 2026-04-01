/**
 * React Query hooks для работы с кейсами.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from './keys';
import type { Database } from '../lib/database.types';
import { cases as baseCases } from '../data/cases';

type CaseRow = Database['public']['Tables']['cases']['Row'];
type CaseInsert = Database['public']['Tables']['cases']['Insert'];
type CaseUpdate = Database['public']['Tables']['cases']['Update'];

/**
 * Получить все кейсы.
 */
export function useCasesQuery() {
  return useQuery({
    queryKey: queryKeys.cases.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CaseRow[];
    },
  });
}

/**
 * Получить кейс по slug.
 */
export function useCaseBySlugQuery(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.cases.byId(slug!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as CaseRow;
    },
    enabled: !!slug,
  });
}

/**
 * Создать новый кейс.
 */
export function useCreateCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCase: CaseInsert) => {
      const { data, error } = await supabase
        .from('cases')
        .insert(newCase)
        .select()
        .single();

      if (error) throw error;
      return data as CaseRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
    },
  });
}

/**
 * Обновить существующий кейс.
 */
export function useUpdateCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, ...updates }: CaseUpdate & { slug: string }) => {
      const { data, error } = await supabase
        .from('cases')
        .update(updates)
        .eq('slug', slug)
        .select()
        .single();

      if (error) throw error;
      return data as CaseRow;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.byId(variables.slug) });
    },
  });
}

/**
 * Удалить кейс.
 */
export function useDeleteCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('slug', slug);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
    },
  });
}

/**
 * Сбросить кейсы к дефолтным значениям.
 */
export function useResetCasesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await supabase.from('cases').delete().neq('slug', 'temp_impossible_slug');
      const { data, error } = await supabase.from('cases').insert(baseCases).select();
      if (error) throw error;
      return data as CaseRow[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
    },
  });
}
