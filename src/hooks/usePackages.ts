import { usePackagesQuery, useUpsertPackageMutation, useDeletePackageMutation, useResetPackagesMutation } from '../queries';
import { mapPackageFromDB, mapPackageToDB } from '../lib/mappers';
import type { Package } from '../data/packages';
import type { Locale } from '../i18n/types';

export const usePackages = (locale: Locale = 'ru') => {
  const { data: packagesRaw, isLoading, error } = usePackagesQuery(locale);
  const upsertMutation = useUpsertPackageMutation(locale);
  const deleteMutation = useDeletePackageMutation();
  const resetMutation = useResetPackagesMutation();

  const packages: Package[] = packagesRaw?.map((row) => mapPackageFromDB(row, locale)) ?? [];

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
    loading: isLoading,
    error: error?.message ?? null,
    upsert,
    remove,
    resetToDefault,
  };
};
