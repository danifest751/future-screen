import { useCallback, useEffect, useState } from 'react';
import type { Locale } from '../i18n/types';
import { errorBoundaryContent } from '../content/components/errorBoundary';
import { loadSiteContent, saveSiteContent } from '../services/siteContent';
import {
  parseHomeEquipmentSectionHeader,
  serializeHomeEquipmentSectionHeader,
  type HomeEquipmentSectionHeader,
} from '../lib/content/homeEquipmentSectionHeader';

const CONTENT_KEY = 'home_equipment_section_header';

export function useHomeEquipmentSectionHeader(locale: Locale = 'ru', fallbackToRu = true) {
  const [data, setData] = useState<HomeEquipmentSectionHeader | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [hasDbRecord, setHasDbRecord] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const row = await loadSiteContent(CONTENT_KEY, locale, fallbackToRu);
      if (!row) {
        setData(null);
        setFallbackUsed(false);
        setHasDbRecord(false);
        return;
      }
      const parsed = parseHomeEquipmentSectionHeader(row.content);
      setData(parsed);
      setFallbackUsed(row.fallbackUsed);
      setHasDbRecord(Boolean(parsed));
    } catch (err) {
      setError(err instanceof Error ? err.message : errorBoundaryContent.loadingError);
    } finally {
      setLoading(false);
    }
  }, [fallbackToRu, locale]);

  const save = useCallback(async (value: HomeEquipmentSectionHeader) => {
    setSaving(true);
    setError(null);
    try {
      const row = await saveSiteContent(
        CONTENT_KEY,
        { content: serializeHomeEquipmentSectionHeader(value) },
        locale,
        fallbackToRu,
      );
      setData(parseHomeEquipmentSectionHeader(row.content));
      setFallbackUsed(row.fallbackUsed);
      setHasDbRecord(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : errorBoundaryContent.savingError);
      return false;
    } finally {
      setSaving(false);
    }
  }, [fallbackToRu, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    fallbackUsed,
    hasDbRecord,
    loading,
    saving,
    error,
    save,
    reload: load,
  };
}
