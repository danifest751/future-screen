import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database, Json } from '../lib/database.types';
import type { Locale } from '../i18n/types';

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
  isFallbackFromRu?: boolean;
};

const isNonEmptyObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length > 0;

const isNonEmptyArray = (value: unknown): value is unknown[] => Array.isArray(value) && value.length > 0;

const hasText = (value: string | null | undefined): boolean => typeof value === 'string' && value.trim().length > 0;

const hasRuFallback = (ruValue: Json, enValue: Json): boolean => {
  const ruObj = (ruValue as Record<string, unknown>) || {};
  const enObj = (enValue as Record<string, unknown>) || {};
  const ruArr = (ruValue as unknown[]) || [];
  const enArr = (enValue as unknown[]) || [];

  if (isNonEmptyObject(ruObj) && !isNonEmptyObject(enObj)) return true;
  if (isNonEmptyArray(ruArr) && !isNonEmptyArray(enArr)) return true;
  return false;
};

const pickLocalizedObject = (
  ruValue: Json,
  enValue: Json,
  locale: Locale,
  fallbackToRu = true
): Record<string, unknown> => {
  const ruObj = (ruValue as Record<string, unknown>) || {};
  const enObj = (enValue as Record<string, unknown>) || {};
  if (locale === 'en' && isNonEmptyObject(enObj)) {
    return fallbackToRu ? { ...ruObj, ...enObj } : enObj;
  }
  if (locale === 'en') {
    return fallbackToRu ? ruObj : {};
  }
  return ruObj;
};

const pickLocalizedArray = <T>(ruValue: Json, enValue: Json, locale: Locale, fallbackToRu = true): T[] => {
  const ruArr = (ruValue as T[]) || [];
  const enArr = (enValue as T[]) || [];
  if (locale === 'en' && isNonEmptyArray(enArr)) {
    return enArr;
  }
  if (locale === 'en') {
    return fallbackToRu ? ruArr : [];
  }
  return ruArr;
};

const mapFromDB = (row: RentalCategoryRow, locale: Locale, fallbackToRu = true): RentalCategory => {
  const hero = pickLocalizedObject(row.hero, row.hero_en, locale, fallbackToRu);

  // Keep blur-title toggle shared across locales.
  const ruHero = (row.hero as Record<string, unknown>) || {};
  if (typeof ruHero.showBlurTitle === 'boolean' && typeof hero.showBlurTitle !== 'boolean') {
    hero.showBlurTitle = ruHero.showBlurTitle;
  }

  return {
    id: row.id,
    slug: row.slug,
    name: locale === 'en' ? row.name_en ?? (fallbackToRu ? row.name : '') : row.name,
    shortName: locale === 'en' ? row.short_name_en ?? (fallbackToRu ? row.short_name : '') : row.short_name,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    seo: pickLocalizedObject(row.seo, row.seo_en, locale, fallbackToRu),
    hero,
    about: pickLocalizedObject(row.about, row.about_en, locale, fallbackToRu),
    useCases: pickLocalizedArray<Array<{ title: string; description: string }>[number]>(
      row.use_cases,
      row.use_cases_en,
      locale,
      fallbackToRu
    ),
    serviceIncludes: pickLocalizedObject(
      row.service_includes,
      row.service_includes_en,
      locale,
      fallbackToRu
    ) as { title: string; items: string[] },
    benefits: pickLocalizedObject(row.benefits, row.benefits_en, locale, fallbackToRu) as {
      title: string;
      items: Array<{ title: string; description: string }>;
    },
    gallery: pickLocalizedArray<Array<{ image: string; alt: string; caption: string }>[number]>(
      row.gallery,
      row.gallery_en,
      locale,
      fallbackToRu
    ),
    faq: pickLocalizedObject(row.faq, row.faq_en, locale, fallbackToRu) as {
      title: string;
      items: Array<{ question: string; answer: string }>;
    },
    bottomCta: pickLocalizedObject(row.bottom_cta, row.bottom_cta_en, locale, fallbackToRu),
    isFallbackFromRu:
      locale === 'en' &&
      ((hasText(row.name) && !hasText(row.name_en)) ||
        (hasText(row.short_name) && !hasText(row.short_name_en)) ||
        hasRuFallback(row.seo, row.seo_en) ||
        hasRuFallback(row.hero, row.hero_en) ||
        hasRuFallback(row.about, row.about_en) ||
        hasRuFallback(row.use_cases, row.use_cases_en) ||
        hasRuFallback(row.service_includes, row.service_includes_en) ||
        hasRuFallback(row.benefits, row.benefits_en) ||
        hasRuFallback(row.gallery, row.gallery_en) ||
        hasRuFallback(row.faq, row.faq_en) ||
        hasRuFallback(row.bottom_cta, row.bottom_cta_en)),
  };
};

const mapToDB = (cat: Partial<RentalCategory>, locale: Locale) => {
  const result: Record<string, unknown> = {};

  if (cat.slug !== undefined) result.slug = cat.slug;
  if (cat.isPublished !== undefined) result.is_published = cat.isPublished;
  if (cat.sortOrder !== undefined) result.sort_order = cat.sortOrder;

  if (locale === 'en') {
    if (cat.name !== undefined) result.name_en = cat.name;
    if (cat.shortName !== undefined) result.short_name_en = cat.shortName;
    if (cat.seo !== undefined) result.seo_en = cat.seo;
    if (cat.hero !== undefined) result.hero_en = cat.hero;
    if (cat.about !== undefined) result.about_en = cat.about;
    if (cat.useCases !== undefined) result.use_cases_en = cat.useCases;
    if (cat.serviceIncludes !== undefined) result.service_includes_en = cat.serviceIncludes;
    if (cat.benefits !== undefined) result.benefits_en = cat.benefits;
    if (cat.gallery !== undefined) result.gallery_en = cat.gallery;
    if (cat.faq !== undefined) result.faq_en = cat.faq;
    if (cat.bottomCta !== undefined) result.bottom_cta_en = cat.bottomCta;
  } else {
    if (cat.name !== undefined) result.name = cat.name;
    if (cat.shortName !== undefined) result.short_name = cat.shortName;
    if (cat.seo !== undefined) result.seo = cat.seo;
    if (cat.hero !== undefined) result.hero = cat.hero;
    if (cat.about !== undefined) result.about = cat.about;
    if (cat.useCases !== undefined) result.use_cases = cat.useCases;
    if (cat.serviceIncludes !== undefined) result.service_includes = cat.serviceIncludes;
    if (cat.benefits !== undefined) result.benefits = cat.benefits;
    if (cat.gallery !== undefined) result.gallery = cat.gallery;
    if (cat.faq !== undefined) result.faq = cat.faq;
    if (cat.bottomCta !== undefined) result.bottom_cta = cat.bottomCta;
  }

  return result;
};

export const loadRentalCategories = async (
  locale: Locale = 'ru',
  fallbackToRu = true
): Promise<RentalCategory[]> => {
  const { data, error } = await supabase
    .from('rental_categories')
    .select('*')
    .eq('is_published', true)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapFromDB(row as RentalCategoryRow, locale, fallbackToRu));
};

export const loadRentalCategoryBySlug = async (
  slug: string,
  locale: Locale = 'ru',
  fallbackToRu = true
): Promise<RentalCategory | null> => {
  const { data, error } = await supabase
    .from('rental_categories')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return mapFromDB(data as RentalCategoryRow, locale, fallbackToRu);
};

export const upsertRentalCategory = async (
  cat: RentalCategory,
  locale: Locale = 'ru'
): Promise<RentalCategory> => {
  const isInsert = !cat.id || cat.id <= 0;
  const mapped = mapToDB(cat, locale);

  if (locale === 'en' && isInsert) {
    // Required RU columns must be present on insert.
    if (cat.name !== undefined) mapped.name = cat.name;
    if (cat.shortName !== undefined) mapped.short_name = cat.shortName;
    if (cat.seo !== undefined) mapped.seo = cat.seo;
    if (cat.hero !== undefined) mapped.hero = cat.hero;
    if (cat.about !== undefined) mapped.about = cat.about;
    if (cat.useCases !== undefined) mapped.use_cases = cat.useCases;
    if (cat.serviceIncludes !== undefined) mapped.service_includes = cat.serviceIncludes;
    if (cat.benefits !== undefined) mapped.benefits = cat.benefits;
    if (cat.gallery !== undefined) mapped.gallery = cat.gallery;
    if (cat.faq !== undefined) mapped.faq = cat.faq;
    if (cat.bottomCta !== undefined) mapped.bottom_cta = cat.bottomCta;
  }

  const { data, error } = await supabase
    .from('rental_categories')
    .upsert({ id: cat.id, ...mapped })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapFromDB(data as RentalCategoryRow, locale);
};

export const deleteRentalCategory = async (id: number): Promise<void> => {
  const { error } = await supabase.from('rental_categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const toggleRentalCategoryBlurTitle = async (id: number, showBlurTitle: boolean): Promise<void> => {
  const { data, error: loadError } = await supabase
    .from('rental_categories')
    .select('hero')
    .eq('id', id)
    .single();
  if (loadError) throw new Error(loadError.message);

  const hero = ((data?.hero as Record<string, unknown>) || {});
  const nextHero = { ...hero, showBlurTitle };

  const { error } = await supabase
    .from('rental_categories')
    .update({ hero: nextHero })
    .eq('id', id);
  if (error) throw new Error(error.message);
};

export const useRentalCategories = (locale: Locale = 'ru', fallbackToRu = true) => {
  const [items, setItems] = useState<RentalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadRentalCategories(locale, fallbackToRu);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [fallbackToRu, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, error, reload: load };
};

export const useRentalCategory = (slug: string, locale: Locale = 'ru', fallbackToRu = true) => {
  const [item, setItem] = useState<RentalCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await loadRentalCategoryBySlug(slug, locale, fallbackToRu);
      setItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [fallbackToRu, slug, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  return { item, loading, error, reload: load };
};
