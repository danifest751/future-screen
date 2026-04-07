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

const mapFromDB = (row: SiteContentRow, locale: Locale = 'ru'): SiteContent => ({
  id: row.id,
  key: row.key,
  title: locale === 'en' ? row.title_en ?? row.title : row.title,
  content: locale === 'en' ? row.content_en ?? row.content : row.content,
  contentHtml: locale === 'en' ? row.content_html_en ?? row.content_html : row.content_html,
  metaTitle: locale === 'en' ? row.meta_title_en ?? row.meta_title : row.meta_title,
  metaDescription:
    locale === 'en' ? row.meta_description_en ?? row.meta_description : row.meta_description,
  isPublished: row.is_published ?? false,
  fontSize:
    locale === 'en'
      ? ((row as Record<string, unknown>).font_size_en as string | null) ??
        ((row as Record<string, unknown>).font_size as string | null) ??
        null
      : ((row as Record<string, unknown>).font_size as string | null) ?? null,
  createdAt: row.created_at ?? '',
  updatedAt: row.updated_at ?? '',
});

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

export async function loadSiteContent(key: string, locale: Locale = 'ru'): Promise<SiteContent | null> {
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .eq('key', key)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return mapFromDB(data as SiteContentRow, locale);
}

export async function saveSiteContent(
  key: string,
  input: SiteContentInput,
  locale: Locale = 'ru'
): Promise<SiteContent> {
  const { data, error } = await supabase
    .from('site_content')
    .upsert({ key, ...mapToDB(input, locale) })
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Content was not returned after upsert');
  return mapFromDB(data as SiteContentRow, locale);
}
