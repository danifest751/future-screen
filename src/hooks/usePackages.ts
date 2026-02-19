import { useCallback, useEffect, useState } from 'react';
import { packages as basePackages, type Package } from '../data/packages';
import { normalizeList } from '../utils/normalizeList';

const STORAGE_KEY = 'fs_admin_packages';

export const usePackages = () => {
  const [items, setItems] = useState<Package[]>(basePackages);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch (err) {
      console.error('Failed to load packages', err);
    }
  }, []);

  const persist = useCallback((next: Package[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error('Failed to save packages', err);
    }
  }, []);

  const upsert = useCallback(
    (payload: Package) => {
      const nextPayload: Package = {
        ...payload,
        includes: normalizeList(payload.includes),
        options: payload.options ? normalizeList(payload.options) : undefined,
        forFormats: normalizeList(payload.forFormats),
      } as Package;

      const exists = items.find((p) => p.id === payload.id);
      const next = exists ? items.map((p) => (p.id === payload.id ? nextPayload : p)) : [...items, nextPayload];
      persist(next);
    },
    [items, persist]
  );

  const remove = useCallback(
    (id: Package['id']) => {
      persist(items.filter((p) => p.id !== id));
    },
    [items, persist]
  );

  const resetToDefault = useCallback(() => {
    persist(basePackages);
  }, [persist]);

  return { packages: items, upsert, remove, resetToDefault };
};
