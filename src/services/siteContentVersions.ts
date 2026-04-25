import { supabase } from '../lib/supabase';

export type SiteContentVersionOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface SiteContentVersion {
  id: string;
  siteContentId: string;
  key: string;
  operation: SiteContentVersionOperation;
  editedBy: string | null;
  editedAt: string;
  title: string | null;
  content: string | null;
  contentHtml: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  fontSize: string | null;
  titleEn: string | null;
  contentEn: string | null;
  contentHtmlEn: string | null;
  metaTitleEn: string | null;
  metaDescriptionEn: string | null;
  fontSizeEn: string | null;
  isPublished: boolean | null;
}

export interface SiteContentSnapshot {
  id: string;
  key: string;
  title: string | null;
  content: string | null;
  contentHtml: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  fontSize: string | null;
  titleEn: string | null;
  contentEn: string | null;
  contentHtmlEn: string | null;
  metaTitleEn: string | null;
  metaDescriptionEn: string | null;
  fontSizeEn: string | null;
  isPublished: boolean | null;
}

interface SiteContentVersionRow {
  id: string;
  site_content_id: string;
  key: string;
  operation: string;
  edited_by: string | null;
  edited_at: string;
  title: string | null;
  content: string | null;
  content_html: string | null;
  meta_title: string | null;
  meta_description: string | null;
  font_size: string | null;
  title_en: string | null;
  content_en: string | null;
  content_html_en: string | null;
  meta_title_en: string | null;
  meta_description_en: string | null;
  font_size_en: string | null;
  is_published: boolean | null;
}

interface SiteContentSnapshotRow {
  id: string;
  key: string;
  title: string | null;
  content: string | null;
  content_html: string | null;
  meta_title: string | null;
  meta_description: string | null;
  font_size: string | null;
  title_en: string | null;
  content_en: string | null;
  content_html_en: string | null;
  meta_title_en: string | null;
  meta_description_en: string | null;
  font_size_en: string | null;
  is_published: boolean | null;
}

const mapRow = (row: SiteContentVersionRow): SiteContentVersion => ({
  id: row.id,
  siteContentId: row.site_content_id,
  key: row.key,
  operation: row.operation as SiteContentVersionOperation,
  editedBy: row.edited_by,
  editedAt: row.edited_at,
  title: row.title,
  content: row.content,
  contentHtml: row.content_html,
  metaTitle: row.meta_title,
  metaDescription: row.meta_description,
  fontSize: row.font_size,
  titleEn: row.title_en,
  contentEn: row.content_en,
  contentHtmlEn: row.content_html_en,
  metaTitleEn: row.meta_title_en,
  metaDescriptionEn: row.meta_description_en,
  fontSizeEn: row.font_size_en,
  isPublished: row.is_published,
});

const mapSnapshotRow = (row: SiteContentSnapshotRow): SiteContentSnapshot => ({
  id: row.id,
  key: row.key,
  title: row.title,
  content: row.content,
  contentHtml: row.content_html,
  metaTitle: row.meta_title,
  metaDescription: row.meta_description,
  fontSize: row.font_size,
  titleEn: row.title_en,
  contentEn: row.content_en,
  contentHtmlEn: row.content_html_en,
  metaTitleEn: row.meta_title_en,
  metaDescriptionEn: row.meta_description_en,
  fontSizeEn: row.font_size_en,
  isPublished: row.is_published,
});

/**
 * Load the most recent versions, optionally filtered by content key.
 * Admin-only via RLS on site_content_versions.
 */
export async function loadSiteContentVersions(options?: {
  key?: string;
  limit?: number;
}): Promise<SiteContentVersion[]> {
  let query = supabase
    .from('site_content_versions')
    .select('*')
    .order('edited_at', { ascending: false })
    .limit(options?.limit ?? 200);

  if (options?.key) {
    query = query.eq('key', options.key);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as SiteContentVersionRow));
}

/**
 * Load distinct keys that have any history, with the most recent edit timestamp.
 */
export async function loadSiteContentKeys(): Promise<
  Array<{ key: string; lastEditedAt: string; lastOperation: SiteContentVersionOperation }>
> {
  const { data, error } = await supabase
    .from('site_content_versions')
    .select('key, edited_at, operation')
    .order('edited_at', { ascending: false })
    .limit(1000);

  if (error) throw new Error(error.message);

  const seen = new Map<string, { lastEditedAt: string; lastOperation: SiteContentVersionOperation }>();
  for (const row of (data ?? []) as Array<{
    key: string;
    edited_at: string;
    operation: string;
  }>) {
    if (!seen.has(row.key)) {
      seen.set(row.key, {
        lastEditedAt: row.edited_at,
        lastOperation: row.operation as SiteContentVersionOperation,
      });
    }
  }
  return Array.from(seen.entries())
    .map(([key, meta]) => ({ key, ...meta }))
    .sort((a, b) => b.lastEditedAt.localeCompare(a.lastEditedAt));
}

/**
 * Load the current raw site_content row for restore previews.
 * Reads both locales without public fallback mapping, so the diff is exact.
 */
export async function loadCurrentSiteContentSnapshot(key: string): Promise<SiteContentSnapshot | null> {
  const { data, error } = await supabase
    .from('site_content')
    .select(
      [
        'id',
        'key',
        'title',
        'content',
        'content_html',
        'meta_title',
        'meta_description',
        'font_size',
        'title_en',
        'content_en',
        'content_html_en',
        'meta_title_en',
        'meta_description_en',
        'font_size_en',
        'is_published',
      ].join(', ')
    )
    .eq('key', key)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapSnapshotRow(data as unknown as SiteContentSnapshotRow);
}

/**
 * For UPDATE history rows, the stored snapshot is the state after the edit.
 * This loads the previous snapshot so admins can undo that specific edit.
 */
export async function loadPreviousSiteContentVersion(version: SiteContentVersion): Promise<SiteContentVersion | null> {
  const { data, error } = await supabase
    .from('site_content_versions')
    .select('*')
    .eq('key', version.key)
    .lt('edited_at', version.editedAt)
    .order('edited_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as unknown as SiteContentVersionRow);
}

/**
 * Restore a version by upserting its snapshot values back onto
 * public.site_content. Leaves id/key unchanged; writes both locales.
 * Note: this will itself append a new UPDATE version to the audit log.
 */
export async function restoreSiteContentVersion(version: SiteContentVersion): Promise<void> {
  const { error } = await supabase
    .from('site_content')
    .upsert(
      {
        id: version.siteContentId,
        key: version.key,
        title: version.title,
        content: version.content,
        content_html: version.contentHtml,
        meta_title: version.metaTitle,
        meta_description: version.metaDescription,
        font_size: version.fontSize,
        title_en: version.titleEn,
        content_en: version.contentEn,
        content_html_en: version.contentHtmlEn,
        meta_title_en: version.metaTitleEn,
        meta_description_en: version.metaDescriptionEn,
        font_size_en: version.fontSizeEn,
        is_published: version.isPublished,
      },
      { onConflict: 'key' }
    );

  if (error) throw new Error(error.message);
}
