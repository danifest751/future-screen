import { useEffect } from 'react';
import { type Category } from '../data/categories';
import { useAdminData } from '../context/AdminDataContext';

export const useCategories = () => {
  const {
    categories,
    ensureCategories,
    upsertCategory,
    removeCategory,
    resetCategories,
  } = useAdminData();

  useEffect(() => {
    void ensureCategories();
  }, [ensureCategories]);

  return {
    categories: categories.items,
    loading: categories.loading,
    error: categories.error,
    upsert: upsertCategory,
    remove: removeCategory,
    resetToDefault: resetCategories,
  };
};
