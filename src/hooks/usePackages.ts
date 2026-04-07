import { usePackagesQuery, useUpsertPackageMutation, useDeletePackageMutation, useResetPackagesMutation } from '../queries';
import { mapPackageFromDB, mapPackageToDB } from '../lib/mappers';
import type { Database } from '../lib/database.types';
import type { Package } from '../data/packages';
import type { Locale } from '../i18n/types';

type PackageRow = Database['public']['Tables']['packages']['Row'];

const hasText = (value: string | null | undefined): boolean => typeof value === 'string' && value.trim().length > 0;
const hasItems = (value: string[] | null | undefined): boolean => Array.isArray(value) && value.length > 0;

const isPackageFallbackFromRu = (row: PackageRow, locale: Locale): boolean => {
  if (locale !== 'en') return false;

  return (
    (hasText(row.name) && !hasText(row.name_en)) ||
    (hasItems(row.for_formats) && !hasItems(row.for_formats_en)) ||
    (hasItems(row.includes) && !hasItems(row.includes_en)) ||
    (hasItems(row.options) && !hasItems(row.options_en)) ||
    (hasText(row.price_hint) && !hasText(row.price_hint_en))
  );
};

export const usePackages = (locale: Locale = 'ru') => {
  const { data: packagesRaw, isLoading, error } = usePackagesQuery(locale);
  const upsertMutation = useUpsertPackageMutation(locale);
  const deleteMutation = useDeletePackageMutation();
  const resetMutation = useResetPackagesMutation();

  const packages: Package[] = packagesRaw?.map((row) => mapPackageFromDB(row, locale)) ?? [];
  const fallbackById = Object.fromEntries(
    (packagesRaw ?? []).map((row) => [String(row.id), isPackageFallbackFromRu(row, locale)])
  ) as Record<string, boolean>;

  const upsert = async (payload: Package) => {
    try {
      const dbPayload = mapPackageToDB(payload, locale);
      await upsertMutation.mutateAsync({ ...dbPayload, id: payload.id } as Parameters<typeof upsertMutation.mutateAsync>[0]);
      return true;
    } catch {
      return false;
    }
  };

  const remove = async (id: Package['id']) => {
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
    packages,
    fallbackById,
    loading: isLoading,
    error: error?.message ?? null,
    upsert,
    remove,
    resetToDefault,
  };
};
