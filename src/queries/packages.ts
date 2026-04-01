/**
 * React Query hooks для работы с пакетами услуг.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from './keys';
import type { Database } from '../lib/database.types';
import { packages as basePackages } from '../data/packages';
import { mapPackageToDB } from '../lib/mappers';

type PackageRow = Database['public']['Tables']['packages']['Row'];
type PackageInsert = Database['public']['Tables']['packages']['Insert'];
type PackageUpdate = Database['public']['Tables']['packages']['Update'];

/**
 * Получить все пакеты.
 */
export function usePackagesQuery() {
  return useQuery({
    queryKey: queryKeys.packages.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      return data as PackageRow[];
    },
  });
}

/**
 * Создать или обновить пакет.
 */
export function useUpsertPackageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pkg: PackageInsert & { id?: number | string }) => {
      const { id, ...rest } = pkg;
      
      // Удаляем id из rest, чтобы он не попал в данные для обновления
      const { id: _, ...dataWithoutId } = rest as Record<string, unknown> & { id?: unknown };
      
      if (id) {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
        if (isNaN(numId)) {
          throw new Error(`Invalid package id: ${id}`);
        }
        const { data, error } = await supabase
          .from('packages')
          .update(dataWithoutId)
          .eq('id', numId)
          .select()
          .single();

        if (error) throw error;
        return data as PackageRow;
      } else {
        const { data, error } = await supabase
          .from('packages')
          .insert(dataWithoutId)
          .select()
          .single();

        if (error) throw error;
        return data as PackageRow;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.packages.all });
    },
  });
}

/**
 * Удалить пакет.
 */
export function useDeletePackageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.packages.all });
    },
  });
}

/**
 * Сбросить пакеты к дефолтным значениям.
 */
export function useResetPackagesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await supabase.from('packages').delete().not('id', 'is', null);
      const { data, error } = await supabase
        .from('packages')
        .insert(basePackages.map(mapPackageToDB))
        .select();
      if (error) throw error;
      return data as PackageRow[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.packages.all });
    },
  });
}
