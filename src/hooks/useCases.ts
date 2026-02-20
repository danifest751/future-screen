import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { cases as baseCases, CaseItem } from '../data/cases';

const sanitizeServices = (services: string[]): CaseItem['services'] =>
  services
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase())
    .filter((s): s is CaseItem['services'][number] =>
      ['led', 'sound', 'light', 'video', 'stage', 'support'].includes(s)
    );

export const useCases = () => {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const { data, error } = await supabase.from('cases').select('*').order('created_at', { ascending: false });
      
      if (error) {
        console.error('Failed to load cases:', error);
        setItems(baseCases);
      } else if (data && data.length > 0) {
        setItems(data);
      } else {
        setItems(baseCases);
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
      setItems(baseCases);
    }
    setLoading(false);
  };

  const addCase = useCallback(
    async (payload: Omit<CaseItem, 'services'> & { services: string[] }) => {
      const next: CaseItem = { ...payload, services: sanitizeServices(payload.services) };
      
      try {
        const { data, error } = await supabase
          .from('cases')
          .insert(next)
          .select();

        if (!error && data) {
          setItems([data[0], ...items]);
        }
      } catch (err) {
        console.error('Failed to add case:', err);
      }
    },
    [items]
  );

  const updateCase = useCallback(
    async (slug: string, payload: Partial<Omit<CaseItem, 'services'>> & { services?: string[] }) => {
      const updates = {
        ...payload,
        services: payload.services ? sanitizeServices(payload.services) : undefined,
      };
      
      try {
        const { data, error } = await supabase
          .from('cases')
          .update(updates)
          .eq('slug', slug)
          .select();

        if (!error && data) {
          setItems(items.map((item) => (item.slug === slug ? data[0] : item)));
        }
      } catch (err) {
        console.error('Failed to update case:', err);
      }
    },
    [items]
  );

  const deleteCase = useCallback(
    async (slug: string) => {
      try {
        await supabase.from('cases').delete().eq('slug', slug);
        setItems(items.filter((item) => item.slug !== slug));
      } catch (err) {
        console.error('Failed to delete case:', err);
      }
    },
    [items]
  );

  const resetToDefault = useCallback(async () => {
    await supabase.from('cases').delete();
    await supabase.from('cases').insert(baseCases);
    setItems(baseCases);
  }, []);

  return { cases: items, loading, addCase, updateCase, deleteCase, resetToDefault };
};
