import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { categories as baseCategories, type Category } from '../data/categories';
import { normalizeList } from '../utils/normalizeList';

export const useCategories = () => {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('id');
      
      if (error) {
        console.error('Failed to load categories:', error);
        setItems(baseCategories);
      } else if (data && data.length > 0) {
        setItems(data);
      } else {
        setItems(baseCategories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      setItems(baseCategories);
    }
    setLoading(false);
  };

  const upsert = useCallback(
    async (payload: Category) => {
      const nextPayload: Category = {
        ...payload,
        bullets: normalizeList(payload.bullets),
      };
      
      try {
        const { data, error } = await supabase
          .from('categories')
          .upsert(nextPayload)
          .select();

        if (!error && data) {
          const exists = items.find((c) => c.id === payload.id);
          const next = exists
            ? items.map((c) => (c.id === payload.id ? data[0] : c))
            : [...items, data[0]];
          setItems(next);
        }
      } catch (err) {
        console.error('Failed to save category:', err);
      }
    },
    [items]
  );

  const remove = useCallback(
    async (id: Category['id']) => {
      try {
        await supabase.from('categories').delete().eq('id', id);
        setItems(items.filter((c) => c.id !== id));
      } catch (err) {
        console.error('Failed to delete category:', err);
      }
    },
    [items]
  );

  const resetToDefault = useCallback(async () => {
    await supabase.from('categories').delete();
    await supabase.from('categories').insert(baseCategories);
    setItems(baseCategories);
  }, []);

  return { categories: items, loading, upsert, remove, resetToDefault };
};
