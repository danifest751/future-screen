import { useCategoriesQuery, useUpsertCategoryMutation, useDeleteCategoryMutation, useResetCategoriesMutation } from '../queries';
import { mapCategoryFromDB, mapCategoryToDB } from '../lib/mappers';
import type { Category } from '../data/categories';
import type { Locale } from '../i18n/types';

export const useCategories = (locale: Locale = 'ru') => {
  const { data: categoriesRaw, isLoading, error } = useCategoriesQuery(locale);
  const upsertMutation = useUpsertCategoryMutation(locale);
  const deleteMutation = useDeleteCategoryMutation();
  const resetMutation = useResetCategoriesMutation();

  const categories: Category[] = categoriesRaw?.map((row) => mapCategoryFromDB(row, locale)) ?? [];

  const upsert = async (payload: Category) => {
    try {
      const dbPayload = mapCategoryToDB(payload, locale, false);
      await upsertMutation.mutateAsync({ ...dbPayload, id: payload.id } as Parameters<typeof upsertMutation.mutateAsync>[0]);
      return true;
    } catch {
      return false;
    }
  };

  const remove = async (id: Category['id']) => {
    try {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      await deleteMutation.mutateAsync(numId);
      return true;
    } catch {
      return false;
    }
  };

  const resetToDefault = async () => {
    try {
      await resetMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  return {
    categories,
    loading: isLoading,
    error: error?.message ?? null,
    upsert,
    remove,
    resetToDefault,
  };
};
