/**
 * React Query hooks для работы с пакетами услуг.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from './keys';
import type { Database } from '../lib/database.types';
import { packages as basePackages } from '../data/packages';
import { mapPackageToDB } from '../lib/mappers';
import type { Locale } from '../i18n/types';

type PackageRow = Database['public']['Tables']['packages']['Row'];
type PackageInsert = Database['public']['Tables']['packages']['Insert'];

/**
 * Получить все пакеты.
 */
export function usePackagesQuery(locale: Locale = 'ru') {
  return useQuery({
    queryKey: queryKeys.packages.all(locale),
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
export function useUpsertPackageMutation(locale: Locale = 'ru') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pkg: PackageInsert & { id?: number | string }) => {
      const { id, created_at: _createdAt, ...dataWithoutId } = pkg as Record<string, unknown> & { id?: unknown; created_at?: unknown };

      if (id) {
        const numId = typeof id === 'string' ? parseInt(id as string, 10) : id as number;
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
      queryClient.invalidateQueries({ queryKey: queryKeys.packages.all(locale) });
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
      queryClient.invalidateQueries({ queryKey: ['packages'] });
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
        .insert(basePackages.map((item) => mapPackageToDB(item)))
        .select();
      if (error) throw error;
      return data as PackageRow[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });
}
