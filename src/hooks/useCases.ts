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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const { data, error } = await supabase.from('cases').select('*').order('created_at', { ascending: false });
      
      if (error) {
        console.error('Failed to load cases:', error);
        setError(error.message);
        setItems([]);
      } else if (data && data.length > 0) {
        setItems(data);
        setError(null);
      } else {
        setItems([]);
        setError(null);
      }
    } catch (err: any) {
      console.error('Failed to load cases:', err);
      setError(err.message || 'Unknown error');
      setItems([]);
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

        if (error) {
          console.error('Failed to add case:', error);
          setError(error.message);
          return false;
        }

        if (data) {
          setItems((prev) => [data[0], ...prev]);
          return true;
        }
        return false;
      } catch (err: any) {
        console.error('Failed to add case:', err);
        setError(err.message || 'Unknown error');
        return false;
      }
    },
    []
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

        if (error) {
          console.error('Failed to update case:', error);
          setError(error.message);
          return false;
        }

        if (data) {
          setItems((prev) => prev.map((item) => (item.slug === slug ? data[0] : item)));
          return true;
        }
        return false;
      } catch (err: any) {
        console.error('Failed to update case:', err);
        setError(err.message || 'Unknown error');
        return false;
      }
    },
    []
  );

  const deleteCase = useCallback(
    async (slug: string) => {
      try {
        const { error } = await supabase.from('cases').delete().eq('slug', slug);
        if (error) {
          console.error('Failed to delete case:', error);
          setError(error.message);
          return false;
        }
        setItems((prev) => prev.filter((item) => item.slug !== slug));
        return true;
      } catch (err: any) {
        console.error('Failed to delete case:', err);
        setError(err.message || 'Unknown error');
        return false;
      }
    },
    []
  );

  const resetToDefault = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await supabase.from('cases').delete().neq('slug', 'temp_impossible_slug'); // Delete all
      const { data, error } = await supabase.from('cases').insert(baseCases).select();
      
      if (error) throw error;
      if (data) setItems(data);
    } catch (err: any) {
      console.error('Failed to reset cases:', err);
      setError(err.message || 'Unknown error');
    }
    setLoading(false);
  }, []);

  return { cases: items, loading, error, addCase, updateCase, deleteCase, resetToDefault };
};
