import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { Locale } from '../i18n/types';

type SiteContentRow = Database['public']['Tables']['site_content']['Row'];

export type SiteContent = {
  id: string;
  key: string;
  title: string | null;
  content: string | null;
  contentHtml: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  fontSize: string | null;
  createdAt: string;
  updatedAt: string;
  fallbackUsed: boolean;
};

export type SiteContentInput = {
  title?: string | null;
  content?: string | null;
  contentHtml?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isPublished?: boolean;
  fontSize?: string | null;
};

const hasText = (value: string | null | undefined): boolean => typeof value === 'string' && value.trim().length > 0;

const mapFromDB = (row: SiteContentRow, locale: Locale = 'ru', fallbackToRu = true): SiteContent => ({
  id: row.id,
  key: row.key,
  title: locale === 'en' ? row.title_en ?? (fallbackToRu ? row.title : null) : row.title,
  content: locale === 'en' ? row.content_en ?? (fallbackToRu ? row.content : null) : row.content,
  contentHtml: locale === 'en' ? row.content_html_en ?? (fallbackToRu ? row.content_html : null) : row.content_html,
  metaTitle: locale === 'en' ? row.meta_title_en ?? (fallbackToRu ? row.meta_title : null) : row.meta_title,
  metaDescription:
    locale === 'en'
      ? row.meta_description_en ?? (fallbackToRu ? row.meta_description : null)
      : row.meta_description,
  isPublished: row.is_published ?? false,
  fontSize:
    locale === 'en'
      ? ((row as Record<string, unknown>).font_size_en as string | null) ??
        (fallbackToRu ? (((row as Record<string, unknown>).font_size as string | null) ?? null) : null)
      : ((row as Record<string, unknown>).font_size as string | null) ?? null,
  createdAt: row.created_at ?? '',
  updatedAt: row.updated_at ?? '',
  fallbackUsed:
    locale === 'en' &&
    ((hasText(row.title) && !hasText(row.title_en)) ||
      (hasText(row.content) && !hasText(row.content_en)) ||
      (hasText(row.content_html) && !hasText(row.content_html_en)) ||
      (hasText(row.meta_title) && !hasText(row.meta_title_en)) ||
      (hasText(row.meta_description) && !hasText(row.meta_description_en)) ||
      (hasText(row.font_size) && !hasText(row.font_size_en))),
});

export async function loadSiteContent(
  key: string,
  locale: Locale = 'ru',
  fallbackToRu = true
): Promise<SiteContent | null> {
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;
  return mapFromDB(data as SiteContentRow, locale, fallbackToRu);
}

export async function saveSiteContent(
  key: string,
  input: SiteContentInput,
  locale: Locale = 'ru',
  fallbackToRu = true
): Promise<SiteContent> {
  const { data, error } = await supabase
    .from('site_content')
    .upsert({ key, ...mapToDB(input, locale) })
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Content was not returned after upsert');
  return mapFromDB(data as SiteContentRow, locale, fallbackToRu);
}

const mapToDB = (input: SiteContentInput, locale: Locale = 'ru'): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  if (input.title !== undefined) result[locale === 'en' ? 'title_en' : 'title'] = input.title;
  if (input.content !== undefined) result[locale === 'en' ? 'content_en' : 'content'] = input.content;
  if (input.contentHtml !== undefined) result[locale === 'en' ? 'content_html_en' : 'content_html'] = input.contentHtml;
  if (input.metaTitle !== undefined) result[locale === 'en' ? 'meta_title_en' : 'meta_title'] = input.metaTitle;
  if (input.metaDescription !== undefined) result[locale === 'en' ? 'meta_description_en' : 'meta_description'] = input.metaDescription;
  if (input.isPublished !== undefined) result.is_published = input.isPublished;
  if (input.fontSize !== undefined) result[locale === 'en' ? 'font_size_en' : 'font_size'] = input.fontSize;
  return result;
};
