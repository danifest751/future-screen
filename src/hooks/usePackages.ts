import { useEffect } from 'react';
import { type Package } from '../data/packages';
import { useAdminData } from '../context/AdminDataContext';

export const usePackages = () => {
  const {
    packages,
    ensurePackages,
    upsertPackage,
    removePackage,
    resetPackages,
  } = useAdminData();

  useEffect(() => {
    void ensurePackages();
  }, [ensurePackages]);

  return {
    packages: packages.items,
    loading: packages.loading,
    error: packages.error,
    upsert: upsertPackage,
    remove: removePackage,
    resetToDefault: resetPackages,
  };
};
