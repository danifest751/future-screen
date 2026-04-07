/**
 * React Query hooks для работы с кейсами.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from './keys';
import type { Database } from '../lib/database.types';
import { cases as baseCases } from '../data/cases';
import { mapCaseToDB } from '../lib/mappers';
import type { Locale } from '../i18n/types';

type CaseRow = Database['public']['Tables']['cases']['Row'];
type CaseInsert = Database['public']['Tables']['cases']['Insert'];
type CaseUpdate = Database['public']['Tables']['cases']['Update'];

/**
 * Получить все кейсы.
 */
export function useCasesQuery(locale: Locale = 'ru') {
  return useQuery({
    queryKey: queryKeys.cases.all(locale),
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
export function useCaseBySlugQuery(slug: string | undefined, locale: Locale = 'ru') {
  return useQuery({
    queryKey: queryKeys.cases.byId(slug!, locale),
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
export function useCreateCaseMutation(locale: Locale = 'ru') {
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
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all(locale) });
    },
  });
}

/**
 * Обновить существующий кейс.
 */
export function useUpdateCaseMutation(locale: Locale = 'ru') {
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
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all(locale) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.byId(variables.slug, locale) });
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
      queryClient.invalidateQueries({ queryKey: ['cases'] });
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
      const { data, error } = await supabase
        .from('cases')
        .insert(baseCases.map((item) => mapCaseToDB(item)))
        .select();
      if (error) throw error;
      return data as CaseRow[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}
