/**
 * React Query hooks для работы с категориями.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from './keys';
import type { Database } from '../lib/database.types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

/**
 * Получить все категории.
 */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories.all,
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
export function useUpsertCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: CategoryInsert & { id?: number }) => {
      const { id, ...rest } = category;
      
      if (id) {
        const { data, error } = await supabase
          .from('categories')
          .update(rest)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data as CategoryRow;
      } else {
        const { data, error } = await supabase
          .from('categories')
          .insert(rest)
          .select()
          .single();

        if (error) throw error;
        return data as CategoryRow;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
