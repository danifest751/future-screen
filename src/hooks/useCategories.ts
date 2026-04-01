import { useCategoriesQuery, useUpsertCategoryMutation, useDeleteCategoryMutation, useResetCategoriesMutation } from '../queries';
import { mapCategoryFromDB } from '../lib/mappers';
import type { Category } from '../data/categories';

export const useCategories = () => {
  const { data: categoriesRaw, isLoading, error } = useCategoriesQuery();
  const upsertMutation = useUpsertCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();
  const resetMutation = useResetCategoriesMutation();

  const categories: Category[] = categoriesRaw?.map(mapCategoryFromDB) ?? [];

  const upsert = async (payload: Category) => {
    try {
      await upsertMutation.mutateAsync(payload as Parameters<typeof upsertMutation.mutateAsync>[0]);
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
