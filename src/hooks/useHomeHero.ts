import { useCallback, useEffect, useMemo, useState } from 'react';
import { getHomePageContent } from '../content/pages/home';
import { loadSiteContent, saveSiteContent } from '../services/siteContent';
import {
  HOME_HERO_KEY,
  type HomeHeroContent,
  parseHomeHero,
  serializeHomeHero,
} from '../lib/content/homeHero';
import type { Locale } from '../i18n/types';

/**
 * Loads the home hero content from site_content, falling back to the
 * bundled defaults so the first paint is never blocked.
 *
 * The hook is shaped like useHomeEquipmentSection — data/save/reload —
 * and is meant to be the reference for migrating other bundled
 * sections (works / events / process / cta / about / led / support)
 * during Phase 5b.
 */
export function useHomeHero(locale: Locale = 'ru', fallbackToRu = true) {
  const staticHero = useMemo(
    () => getHomePageContent(locale).hero as HomeHeroContent,
    [locale],
  );

  const [data, setData] = useState<HomeHeroContent>(staticHero);
  const [hasDbRecord, setHasDbRecord] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const row = await loadSiteContent(HOME_HERO_KEY, locale, fallbackToRu);
      const parsed = parseHomeHero(row?.content ?? null);
      if (row && parsed) {
        setData(parsed);
        setHasDbRecord(true);
        return;
      }
      setData(staticHero);
      setHasDbRecord(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hero');
      setData(staticHero);
      setHasDbRecord(false);
    } finally {
      setLoading(false);
    }
  }, [fallbackToRu, locale, staticHero]);

  const save = useCallback(
    async (value: HomeHeroContent): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const row = await saveSiteContent(
          HOME_HERO_KEY,
          { content: serializeHomeHero(value) },
          locale,
          fallbackToRu,
        );
        const parsed = parseHomeHero(row.content);
        setData(parsed ?? value);
        setHasDbRecord(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save hero');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fallbackToRu, locale],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { data, staticHero, hasDbRecord, loading, saving, error, save, reload: load };
}
