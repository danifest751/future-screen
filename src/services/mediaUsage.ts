import { supabase } from '../lib/supabase';

export interface MediaUsageEntry {
  caseId: number;
  caseSlug: string | null;
  caseTitle: string | null;
}

export type MediaUsageMap = Map<string, MediaUsageEntry[]>;

/**
 * Look up which cases reference each of the given media ids via
 * case_media_links. Returns a Map keyed by media id; missing keys mean
 * "no known references". Empty input short-circuits to an empty map.
 *
 * Note: case_media_links has ON DELETE CASCADE on media_id, so deleting
 * the media silently breaks these links — surfacing this lookup in the
 * delete confirmation lets admins decide knowingly.
 */
export async function loadMediaUsage(mediaIds: string[]): Promise<MediaUsageMap> {
  const unique = Array.from(new Set(mediaIds.filter(Boolean)));
  const result: MediaUsageMap = new Map();
  if (unique.length === 0) return result;

  const { data, error } = await supabase
    .from('case_media_links')
    .select('media_id, case_id, cases:case_id (slug, title)')
    .in('media_id', unique);

  if (error) throw new Error(error.message);

  // Supabase FK joins can be returned either as an object (1:1) or as a
  // single-element array depending on the relationship hint — normalize both.
  type RawRow = {
    media_id: string;
    case_id: number;
    cases:
      | { slug: string | null; title: string | null }
      | Array<{ slug: string | null; title: string | null }>
      | null;
  };
  for (const row of (data ?? []) as unknown as RawRow[]) {
    const caseRow = Array.isArray(row.cases) ? row.cases[0] ?? null : row.cases;
    const list = result.get(row.media_id) ?? [];
    list.push({
      caseId: row.case_id,
      caseSlug: caseRow?.slug ?? null,
      caseTitle: caseRow?.title ?? null,
    });
    result.set(row.media_id, list);
  }

  return result;
}

export const totalUsageCount = (map: MediaUsageMap): number => {
  let total = 0;
  for (const list of map.values()) total += list.length;
  return total;
};
