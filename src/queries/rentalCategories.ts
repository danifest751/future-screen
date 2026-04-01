/**
 * React Query hooks для работы с категориями аренды.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from './keys';
import type { Database } from '../lib/database.types';

type RentalCategoryRow = Database['public']['Tables']['rental_categories']['Row'];
type RentalCategoryInsert = Database['public']['Tables']['rental_categories']['Insert'];
type RentalCategoryUpdate = Database['public']['Tables']['rental_categories']['Update'];

/**
 * Получить все категории аренды.
 */
export function useRentalCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.rentalCategories.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as RentalCategoryRow[];
    },
  });
}

/**
 * Получить категорию аренды по slug.
 */
export function useRentalCategoryBySlugQuery(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.rentalCategories.bySlug(slug!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as RentalCategoryRow;
    },
    enabled: !!slug,
  });
}

/**
 * Создать или обновить категорию аренды.
 */
export function useUpsertRentalCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: RentalCategoryInsert & { id?: number | string }) => {
      const { id, ...rest } = category;
      
      // Удаляем id из rest, чтобы он не попал в данные для обновления
      const { id: _, ...dataWithoutId } = rest as Record<string, unknown> & { id?: unknown };
      
      if (id) {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
        if (isNaN(numId)) {
          throw new Error(`Invalid rental category id: ${id}`);
        }
        const { data, error } = await supabase
          .from('rental_categories')
          .update(dataWithoutId)
          .eq('id', numId)
          .select()
          .single();

        if (error) throw error;
        return data as RentalCategoryRow;
      } else {
        const { data, error } = await supabase
          .from('rental_categories')
          .insert(dataWithoutId)
          .select()
          .single();

        if (error) throw error;
        return data as RentalCategoryRow;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rentalCategories.all });
    },
  });
}

/**
 * Удалить категорию аренды.
 */
export function useDeleteRentalCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('rental_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rentalCategories.all });
    },
  });
}
