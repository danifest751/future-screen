import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { packages as basePackages, type Package } from '../data/packages';
import { normalizeList } from '../utils/normalizeList';

type PackageRow = {
  id: Package['id'];
  name: string;
  for_formats: string[];
  includes: string[];
  options?: string[];
  price_hint: string;
};

const getErrorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Unknown error');

const mapPackageFromDB = (row: PackageRow): Package => ({
  id: row.id,
  name: row.name,
  forFormats: row.for_formats,
  includes: row.includes,
  options: row.options,
  priceHint: row.price_hint,
});

const mapPackageToDB = (pkg: Package) => {
  const row: Record<string, unknown> = {
    name: pkg.name,
    for_formats: normalizeList(pkg.forFormats),
    includes: normalizeList(pkg.includes),
    options: pkg.options ? normalizeList(pkg.options) : undefined,
    price_hint: pkg.priceHint,
  };

  if (pkg.id !== undefined && pkg.id !== null && String(pkg.id).trim() !== '') {
    row.id = typeof pkg.id === 'string' && /^\d+$/.test(pkg.id) ? Number(pkg.id) : pkg.id;
  }

  return row;
};

export const usePackages = () => {
  const [items, setItems] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase.from('packages').select('*').order('id');
      
      if (error) {
        console.error('Failed to load packages:', error);
        setError(error.message);
        setItems([]);
      } else if (data && data.length > 0) {
        setItems(data.map(mapPackageFromDB));
        setError(null);
      } else {
        setItems([]);
        setError(null);
      }
    } catch (err: unknown) {
      console.error('Failed to load packages:', err);
      setError(getErrorMessage(err));
      setItems([]);
    }
    setLoading(false);
  };

  const upsert = useCallback(
    async (payload: Package) => {
      try {
        const { data, error } = await supabase
          .from('packages')
          .upsert(mapPackageToDB(payload))
          .select();

        if (error) {
          console.error('Failed to save package:', error);
          setError(error.message);
          return false;
        }

        if (data) {
          const updatedPackage = mapPackageFromDB(data[0]);
          setItems((prev) => {
            const exists = prev.find((p) => p.id === payload.id);
            return exists
              ? prev.map((p) => (p.id === payload.id ? updatedPackage : p))
              : [...prev, updatedPackage];
          });
          return true;
        }
        return false;
      } catch (err: unknown) {
        console.error('Failed to save package:', err);
        setError(getErrorMessage(err));
        return false;
      }
    },
    []
  );

  const remove = useCallback(
    async (id: Package['id']) => {
      try {
        const { error } = await supabase.from('packages').delete().eq('id', id);
        if (error) {
          console.error('Failed to delete package:', error);
          setError(error.message);
          return false;
        }
        setItems((prev) => prev.filter((p) => p.id !== id));
        return true;
      } catch (err: unknown) {
        console.error('Failed to delete package:', err);
        setError(getErrorMessage(err));
        return false;
      }
    },
    []
  );

  const resetToDefault = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await supabase.from('packages').delete().not('id', 'is', null); // Delete all
      
      const defaultData = basePackages.map(mapPackageToDB);
      const { data, error } = await supabase.from('packages').insert(defaultData).select();
      
      if (error) throw error;
      if (data) setItems(data.map(mapPackageFromDB));
    } catch (err: unknown) {
      console.error('Failed to reset packages:', err);
      setError(getErrorMessage(err));
    }
    setLoading(false);
  }, []);

  return { packages: items, loading, error, upsert, remove, resetToDefault };
};
