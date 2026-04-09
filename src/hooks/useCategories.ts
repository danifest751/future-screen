import { useCategoriesQuery, useUpsertCategoryMutation, useDeleteCategoryMutation, useResetCategoriesMutation } from '../queries';
import { mapCategoryFromDB, mapCategoryToDB } from '../lib/mappers';
import type { Database } from '../lib/database.types';
import type { Category } from '../data/categories';
import type { Locale } from '../i18n/types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];

const hasText = (value: string | null | undefined): boolean => typeof value === 'string' && value.trim().length > 0;
const hasItems = (value: string[] | null | undefined): boolean => Array.isArray(value) && value.length > 0;

const isCategoryFallbackFromRu = (row: CategoryRow, locale: Locale): boolean => {
  if (locale !== 'en') return false;

  return (
    (hasText(row.title) && !hasText(row.title_en)) ||
    (hasText(row.short_description) && !hasText(row.short_description_en)) ||
    (hasItems(row.bullets) && !hasItems(row.bullets_en))
  );
};

export const useCategories = (locale: Locale = 'ru', fallbackToRu = true) => {
  const { data: categoriesRaw, isLoading, error } = useCategoriesQuery(locale);
  const upsertMutation = useUpsertCategoryMutation(locale);
  const deleteMutation = useDeleteCategoryMutation();
  const resetMutation = useResetCategoriesMutation();

  const categories: Category[] = categoriesRaw?.map((row) => mapCategoryFromDB(row, locale, fallbackToRu)) ?? [];
  const getEditorCategory = (id: Category['id']): Category | null => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const row = categoriesRaw?.find((item) => item.id === numericId);
    return row ? mapCategoryFromDB(row, locale, false) : null;
  };
  const fallbackById = Object.fromEntries(
    (categoriesRaw ?? []).map((row) => [String(row.id), isCategoryFallbackFromRu(row, locale)])
  ) as Record<string, boolean>;

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
    getEditorCategory,
    fallbackById,
    loading: isLoading,
    error: error?.message ?? null,
    upsert,
    remove,
    resetToDefault,
  };
};
