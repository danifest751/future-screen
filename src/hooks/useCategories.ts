import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { categories as baseCategories, type Category } from '../data/categories';
import { normalizeList } from '../utils/normalizeList';

const mapCategoryFromDB = (row: any): Category => ({
  id: row.id,
  title: row.title,
  shortDescription: row.short_description,
  bullets: row.bullets,
  pagePath: row.page_path,
});

const mapCategoryToDB = (cat: Category) => {
  const row: Record<string, unknown> = {
    title: cat.title,
    short_description: cat.shortDescription,
    bullets: normalizeList(cat.bullets),
    page_path: cat.pagePath,
  };

  if (cat.id !== undefined && cat.id !== null && String(cat.id).trim() !== '') {
    row.id = typeof cat.id === 'string' && /^\d+$/.test(cat.id) ? Number(cat.id) : cat.id;
  }

  return row;
};

export const useCategories = () => {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('id');
      
      if (error) {
        console.error('Failed to load categories:', error);
        setError(error.message);
        setItems([]);
      } else if (data && data.length > 0) {
        setItems(data.map(mapCategoryFromDB));
        setError(null);
      } else {
        setItems([]);
        setError(null);
      }
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setError(err.message || 'Unknown error');
      setItems([]);
    }
    setLoading(false);
  };

  const upsert = useCallback(
    async (payload: Category) => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .upsert(mapCategoryToDB(payload))
          .select();

        if (error) {
          console.error('Failed to save category:', error);
          setError(error.message);
          return false;
        }

        if (data) {
          const updatedCat = mapCategoryFromDB(data[0]);
          setItems((prev) => {
            const exists = prev.find((c) => c.id === payload.id);
            return exists
              ? prev.map((c) => (c.id === payload.id ? updatedCat : c))
              : [...prev, updatedCat];
          });
          return true;
        }
        return false;
      } catch (err: any) {
        console.error('Failed to save category:', err);
        setError(err.message || 'Unknown error');
        return false;
      }
    },
    []
  );

  const remove = useCallback(
    async (id: Category['id']) => {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) {
          console.error('Failed to delete category:', error);
          setError(error.message);
          return false;
        }
        setItems((prev) => prev.filter((c) => c.id !== id));
        return true;
      } catch (err: any) {
        console.error('Failed to delete category:', err);
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
      await supabase.from('categories').delete().not('id', 'is', null); // Delete all
      
      const defaultData = baseCategories.map(mapCategoryToDB);
      const { data, error } = await supabase.from('categories').insert(defaultData).select();
      
      if (error) throw error;
      if (data) setItems(data.map(mapCategoryFromDB));
    } catch (err: any) {
      console.error('Failed to reset categories:', err);
      setError(err.message || 'Unknown error');
    }
    setLoading(false);
  }, []);

  return { categories: items, loading, error, upsert, remove, resetToDefault };
};
