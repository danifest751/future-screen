import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type RentalCategoryRow = Database['public']['Tables']['rental_categories']['Row'];

export type RentalCategory = {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  isPublished: boolean;
  sortOrder: number;
  seo: Record<string, unknown>;
  hero: Record<string, unknown>;
  about: Record<string, unknown>;
  useCases: Array<{ title: string; description: string }>;
  serviceIncludes: { title: string; items: string[] };
  benefits: { title: string; items: Array<{ title: string; description: string }> };
  gallery: Array<{ image: string; alt: string; caption: string }>;
  faq: { title: string; items: Array<{ question: string; answer: string }> };
  bottomCta: Record<string, unknown>;
};

const mapFromDB = (row: RentalCategoryRow): RentalCategory => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  shortName: row.short_name,
  isPublished: row.is_published,
  sortOrder: row.sort_order,
  seo: (row.seo as Record<string, unknown>) || {},
  hero: (row.hero as Record<string, unknown>) || {},
  about: (row.about as Record<string, unknown>) || {},
  useCases: (row.use_cases as Array<{ title: string; description: string }>) || [],
  serviceIncludes: (row.service_includes as { title: string; items: string[] }) || { title: '', items: [] },
  benefits: (row.benefits as { title: string; items: Array<{ title: string; description: string }> }) || { title: '', items: [] },
  gallery: (row.gallery as Array<{ image: string; alt: string; caption: string }>) || [],
  faq: (row.faq as { title: string; items: Array<{ question: string; answer: string }> }) || { title: '', items: [] },
  bottomCta: (row.bottom_cta as Record<string, unknown>) || {},
});

const mapToDB = (cat: Partial<RentalCategory>) => {
  const result: Record<string, unknown> = {};
  if (cat.name !== undefined) result.name = cat.name;
  if (cat.shortName !== undefined) result.short_name = cat.shortName;
  if (cat.slug !== undefined) result.slug = cat.slug;
  if (cat.isPublished !== undefined) result.is_published = cat.isPublished;
  if (cat.sortOrder !== undefined) result.sort_order = cat.sortOrder;
  if (cat.seo !== undefined) result.seo = cat.seo;
  if (cat.hero !== undefined) result.hero = cat.hero;
  if (cat.about !== undefined) result.about = cat.about;
  if (cat.useCases !== undefined) result.use_cases = cat.useCases;
  if (cat.serviceIncludes !== undefined) result.service_includes = cat.serviceIncludes;
  if (cat.benefits !== undefined) result.benefits = cat.benefits;
  if (cat.gallery !== undefined) result.gallery = cat.gallery;
  if (cat.faq !== undefined) result.faq = cat.faq;
  if (cat.bottomCta !== undefined) result.bottom_cta = cat.bottomCta;
  return result;
};

export const loadRentalCategories = async (): Promise<RentalCategory[]> => {
  const { data, error } = await supabase
    .from('rental_categories')
    .select('*')
    .eq('is_published', true)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapFromDB);
};

export const loadRentalCategoryBySlug = async (slug: string): Promise<RentalCategory | null> => {
  const { data, error } = await supabase
    .from('rental_categories')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return mapFromDB(data as RentalCategoryRow);
};

export const upsertRentalCategory = async (cat: RentalCategory): Promise<RentalCategory> => {
  const { data, error } = await supabase
    .from('rental_categories')
    .upsert({ id: cat.id, ...mapToDB(cat) })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapFromDB(data as RentalCategoryRow);
};

export const deleteRentalCategory = async (id: number): Promise<void> => {
  const { error } = await supabase.from('rental_categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const toggleRentalCategoryBlurTitle = async (id: number, showBlurTitle: boolean): Promise<void> => {
  const { error } = await supabase
    .from('rental_categories')
    .update({ hero: { showBlurTitle } })
    .eq('id', id);
  if (error) throw new Error(error.message);
};

export const useRentalCategories = () => {
  const [items, setItems] = useState<RentalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadRentalCategories();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { items, loading, error, reload: load };
};

export const useRentalCategory = (slug: string) => {
  const [item, setItem] = useState<RentalCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await loadRentalCategoryBySlug(slug);
      setItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { void load(); }, [load]);

  return { item, loading, error, reload: load };
};
