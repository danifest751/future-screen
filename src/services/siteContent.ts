import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

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

const mapFromDB = (row: SiteContentRow): SiteContent => ({
  id: row.id,
  key: row.key,
  title: row.title,
  content: row.content,
  contentHtml: row.content_html,
  metaTitle: row.meta_title,
  metaDescription: row.meta_description,
  isPublished: row.is_published ?? false,
  fontSize: (row as Record<string, unknown>).font_size as string | null ?? null,
  createdAt: row.created_at ?? '',
  updatedAt: row.updated_at ?? '',
});

const mapToDB = (input: SiteContentInput): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  if (input.title !== undefined) result.title = input.title;
  if (input.content !== undefined) result.content = input.content;
  if (input.contentHtml !== undefined) result.content_html = input.contentHtml;
  if (input.metaTitle !== undefined) result.meta_title = input.metaTitle;
  if (input.metaDescription !== undefined) result.meta_description = input.metaDescription;
  if (input.isPublished !== undefined) result.is_published = input.isPublished;
  if (input.fontSize !== undefined) result.font_size = input.fontSize;
  return result;
};

export async function loadSiteContent(key: string): Promise<SiteContent | null> {
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .eq('key', key)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return mapFromDB(data as SiteContentRow);
}

export async function saveSiteContent(
  key: string,
  input: SiteContentInput
): Promise<SiteContent> {
  const { data, error } = await supabase
    .from('site_content')
    .upsert({ key, ...mapToDB(input) })
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Content was not returned after upsert');
  return mapFromDB(data as SiteContentRow);
}
