import { usePackagesQuery, useUpsertPackageMutation, useDeletePackageMutation, useResetPackagesMutation } from '../queries';
import { mapPackageFromDB } from '../lib/mappers';
import type { Package } from '../data/packages';

export const usePackages = () => {
  const { data: packagesRaw, isLoading, error } = usePackagesQuery();
  const upsertMutation = useUpsertPackageMutation();
  const deleteMutation = useDeletePackageMutation();
  const resetMutation = useResetPackagesMutation();

  const packages: Package[] = packagesRaw?.map(mapPackageFromDB) ?? [];

  const upsert = async (payload: Package) => {
    try {
      await upsertMutation.mutateAsync(payload as Parameters<typeof upsertMutation.mutateAsync>[0]);
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
