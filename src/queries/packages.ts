/**
 * React Query hooks для работы с пакетами услуг.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from './keys';
import type { Database } from '../lib/database.types';

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
    mutationFn: async (pkg: PackageInsert & { id?: number }) => {
      const { id, ...rest } = pkg;
      
      if (id) {
        const { data, error } = await supabase
          .from('packages')
          .update(rest)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data as PackageRow;
      } else {
        const { data, error } = await supabase
          .from('packages')
          .insert(rest)
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
