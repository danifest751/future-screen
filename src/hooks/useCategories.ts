import { useCallback, useEffect, useState } from 'react';
import { categories as baseCategories, type Category } from '../data/categories';
import { normalizeList } from '../utils/normalizeList';

const STORAGE_KEY = 'fs_admin_categories';

export const useCategories = () => {
  const [items, setItems] = useState<Category[]>(baseCategories);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  const persist = useCallback((next: Category[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error('Failed to save categories', err);
    }
  }, []);

  const upsert = useCallback(
    (payload: Category) => {
      const nextPayload: Category = {
        ...payload,
        bullets: normalizeList(payload.bullets),
      };
      const exists = items.find((c) => c.id === payload.id);
      const next = exists ? items.map((c) => (c.id === payload.id ? nextPayload : c)) : [...items, nextPayload];
      persist(next);
    },
    [items, persist]
  );

  const remove = useCallback(
    (id: Category['id']) => {
      persist(items.filter((c) => c.id !== id));
    },
    [items, persist]
  );

  const resetToDefault = useCallback(() => {
    persist(baseCategories);
  }, [persist]);

  return { categories: items, upsert, remove, resetToDefault };
};
