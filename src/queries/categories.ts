/**
 * React Query hooks для работы с категориями.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from './keys';
import type { Database } from '../lib/database.types';
import { categories as baseCategories } from '../data/categories';
import { mapCategoryToDB } from '../lib/mappers';
import type { Locale } from '../i18n/types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];

/**
 * Получить все категории.
 */
export function useCategoriesQuery(locale: Locale = 'ru') {
  return useQuery({
    queryKey: queryKeys.categories.all(locale),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      return data as CategoryRow[];
    },
  });
}

/**
 * Создать или обновить категорию.
 */
export function useUpsertCategoryMutation(locale: Locale = 'ru') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: CategoryInsert & { id?: number | string }) => {
      const { id, created_at: _createdAt, ...dataWithoutId } = category as Record<string, unknown> & { id?: unknown; created_at?: unknown };

      if (id) {
        const numId = typeof id === 'string' ? parseInt(id as string, 10) : id as number;
        if (isNaN(numId)) {
          throw new Error(`Invalid category id: ${id}`);
        }
        const { data, error } = await supabase
          .from('categories')
          .update(dataWithoutId)
          .eq('id', numId)
          .select()
          .single();

        if (error) throw error;
        return data as CategoryRow;
      } else {
        const { data, error } = await supabase
          .from('categories')
          .insert(dataWithoutId)
          .select()
          .single();

        if (error) throw error;
        return data as CategoryRow;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all(locale) });
    },
  });
}

/**
 * Удалить категорию.
 */
export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

/**
 * Сбросить категории к дефолтным значениям.
 */
export function useResetCategoriesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await supabase.from('categories').delete().not('id', 'is', null);
      const { data, error } = await supabase
        .from('categories')
        .insert(baseCategories.map((item) => mapCategoryToDB(item)))
        .select();
      if (error) throw error;
      return data as CategoryRow[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
