import { useCallback, useEffect, useState } from 'react';
import { loadSiteContent, saveSiteContent } from '../services/siteContent';
import { useOptionalEditMode } from '../context/EditModeContext';
import type { Locale } from '../i18n/types';

type Parse<T> = (raw: string | null | undefined) => T | null;
type Serialize<T> = (value: T) => string;

export interface SiteSectionHook<T> {
  data: T;
  hasDbRecord: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  save: (next: T) => Promise<boolean>;
  reload: () => Promise<void>;
}

/**
 * Generic hook for a single JSON-shaped row in public.site_content. Loads
 * the row for the given locale, parses it through a caller-provided
 * validator, falls back to a bundled `staticValue` for instant first
 * paint, and upserts the whole blob via saveSiteContent on save.
 *
 * Each call-site (useHomeHero, useHomeWorks, …) supplies a content
 * `key`, a type guard `parse`, and a `serialize` function. That keeps
 * types sharp per section without duplicating the load/save lifecycle.
 */
export function useSiteSectionJson<T>(
  key: string,
  staticValue: T,
  parse: Parse<T>,
  serialize: Serialize<T>,
  locale: Locale = 'ru',
  fallbackToRu = true,
): SiteSectionHook<T> {
  const [data, setData] = useState<T>(staticValue);
  const [hasDbRecord, setHasDbRecord] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Subscribe to inline-edit save events so a save originating from a
  // sibling Editable* (e.g. EditableImage in another card) refetches
  // this section. Reading from the optional ctx makes the hook safe to
  // use on public pages that don't mount EditModeProvider in tests.
  const { savesVersion } = useOptionalEditMode();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const row = await loadSiteContent(key, locale, fallbackToRu);
      const parsed = parse(row?.content ?? null);
      if (row && parsed) {
        setData(parsed);
        setHasDbRecord(true);
        return;
      }
      setData(staticValue);
      setHasDbRecord(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load section');
      setData(staticValue);
      setHasDbRecord(false);
    } finally {
      setLoading(false);
    }
  }, [fallbackToRu, key, locale, parse, staticValue]);

  const save = useCallback(
    async (value: T): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const row = await saveSiteContent(
          key,
          { content: serialize(value) },
          locale,
          fallbackToRu,
        );
        const parsed = parse(row.content);
        setData(parsed ?? value);
        setHasDbRecord(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save section');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fallbackToRu, key, locale, parse, serialize],
  );

  useEffect(() => {
    void load();
  }, [load, savesVersion]);

  return { data, hasDbRecord, loading, saving, error, save, reload: load };
}
