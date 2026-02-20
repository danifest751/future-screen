import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { packages as basePackages, type Package } from '../data/packages';
import { normalizeList } from '../utils/normalizeList';

export const usePackages = () => {
  const [items, setItems] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase.from('packages').select('*').order('id');
      
      if (error) {
        console.error('Failed to load packages:', error);
        // Fallback to defaults
        setItems(basePackages);
      } else if (data && data.length > 0) {
        setItems(data);
      } else {
        // Если таблица пустая, используем дефолтные
        setItems(basePackages);
      }
    } catch (err) {
      console.error('Failed to load packages:', err);
      setItems(basePackages);
    }
    setLoading(false);
  };

  const upsert = useCallback(
    async (payload: Package) => {
      const nextPayload: Package = {
        ...payload,
        includes: normalizeList(payload.includes),
        options: payload.options ? normalizeList(payload.options) : undefined,
        forFormats: normalizeList(payload.forFormats),
      } as Package;

      try {
        const { data, error } = await supabase
          .from('packages')
          .upsert(nextPayload)
          .select();

        if (!error && data) {
          const exists = items.find((p) => p.id === payload.id);
          const next = exists
            ? items.map((p) => (p.id === payload.id ? data[0] : p))
            : [...items, data[0]];
          setItems(next);
        }
      } catch (err) {
        console.error('Failed to save package:', err);
      }
    },
    [items]
  );

  const remove = useCallback(
    async (id: Package['id']) => {
      try {
        await supabase.from('packages').delete().eq('id', id);
        setItems(items.filter((p) => p.id !== id));
      } catch (err) {
        console.error('Failed to delete package:', err);
      }
    },
    [items]
  );

  const resetToDefault = useCallback(async () => {
    await supabase.from('packages').delete();
    await supabase.from('packages').insert(basePackages);
    setItems(basePackages);
  }, []);

  return { packages: items, loading, upsert, remove, resetToDefault };
};
