import { useCallback, useEffect, useState } from 'react';
import { cases as baseCases, CaseItem } from '../data/cases';

const STORAGE_KEY = 'fs_admin_cases';

const sanitizeServices = (services: string[]): CaseItem['services'] =>
  services
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase())
    .filter((s): s is CaseItem['services'][number] =>
      ['led', 'sound', 'light', 'video', 'stage', 'support'].includes(s)
    );

export const useCases = () => {
  const [items, setItems] = useState<CaseItem[]>(baseCases);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CaseItem[];
        setItems(parsed);
      }
    } catch (err) {
      console.error('Failed to load cases from storage', err);
    }
  }, []);

  const persist = useCallback((next: CaseItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error('Failed to save cases', err);
    }
  }, []);

  const addCase = useCallback(
    (payload: Omit<CaseItem, 'services'> & { services: string[] }) => {
      const next: CaseItem = { ...payload, services: sanitizeServices(payload.services) };
      persist([...items, next]);
    },
    [items, persist]
  );

  const updateCase = useCallback(
    (slug: string, payload: Partial<Omit<CaseItem, 'services'>> & { services?: string[] }) => {
      const nextItems = items.map((item) =>
        item.slug === slug
          ? {
              ...item,
              ...payload,
              services: payload.services ? sanitizeServices(payload.services) : item.services,
            }
          : item
      );
      persist(nextItems);
    },
    [items, persist]
  );

  const deleteCase = useCallback(
    (slug: string) => {
      persist(items.filter((item) => item.slug !== slug));
    },
    [items, persist]
  );

  const resetToDefault = useCallback(() => {
    persist(baseCases);
  }, [persist]);

  return { cases: items, addCase, updateCase, deleteCase, resetToDefault };
};
