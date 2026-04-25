import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Locale } from '../i18n/types';
import { errorBoundaryContent } from '../content/components/errorBoundary';
import { getHomePageContent } from '../content/pages/home';
import { loadSiteContent, saveSiteContent } from '../services/siteContent';
import { useOptionalEditMode } from '../context/EditModeContext';
import {
  HOME_EQUIPMENT_SECTION_KEY,
  HOME_EQUIPMENT_SECTION_LEGACY_HEADER_KEY,
  parseHomeEquipmentSection,
  serializeHomeEquipmentSection,
  type HomeEquipmentSectionContent,
} from '../lib/content/homeEquipmentSection';
import { parseHomeEquipmentSectionHeader } from '../lib/content/homeEquipmentSectionHeader';

export function useHomeEquipmentSection(locale: Locale = 'ru', fallbackToRu = true) {
  const staticSection = useMemo(
    () => getHomePageContent(locale).equipmentSection as HomeEquipmentSectionContent,
    [locale],
  );

  const [data, setData] = useState<HomeEquipmentSectionContent>(staticSection);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [hasDbRecord, setHasDbRecord] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { savesVersion } = useOptionalEditMode();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const row = await loadSiteContent(HOME_EQUIPMENT_SECTION_KEY, locale, fallbackToRu);
      const parsed = parseHomeEquipmentSection(row?.content ?? null);

      if (row && parsed) {
        setData(parsed);
        setFallbackUsed(row.fallbackUsed);
        setHasDbRecord(true);
        return;
      }

      // Backward compatibility: migrate visual state from old header key if it exists.
      const legacyRow = await loadSiteContent(HOME_EQUIPMENT_SECTION_LEGACY_HEADER_KEY, locale, fallbackToRu);
      const legacyHeader = parseHomeEquipmentSectionHeader(legacyRow?.content ?? null);
      if (legacyRow && legacyHeader) {
        setData({
          ...staticSection,
          badge: legacyHeader.badge,
          title: legacyHeader.title,
          accentTitle: legacyHeader.accentTitle,
          subtitle: legacyHeader.subtitle,
        });
        setFallbackUsed(legacyRow.fallbackUsed);
        setHasDbRecord(true);
        return;
      }

      setData(staticSection);
      setFallbackUsed(false);
      setHasDbRecord(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorBoundaryContent.loadingError);
      setData(staticSection);
      setFallbackUsed(false);
      setHasDbRecord(false);
    } finally {
      setLoading(false);
    }
  }, [fallbackToRu, locale, staticSection]);

  const save = useCallback(
    async (value: HomeEquipmentSectionContent) => {
      setSaving(true);
      setError(null);
      try {
        const row = await saveSiteContent(
          HOME_EQUIPMENT_SECTION_KEY,
          { content: serializeHomeEquipmentSection(value) },
          locale,
          fallbackToRu,
        );
        const parsed = parseHomeEquipmentSection(row.content);
        setData(parsed ?? value);
        setFallbackUsed(row.fallbackUsed);
        setHasDbRecord(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : errorBoundaryContent.savingError);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fallbackToRu, locale],
  );

  const initializeFromStatic = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const ruSection = getHomePageContent('ru').equipmentSection as HomeEquipmentSectionContent;
      const enSection = getHomePageContent('en').equipmentSection as HomeEquipmentSectionContent;

      await Promise.all([
        saveSiteContent(
          HOME_EQUIPMENT_SECTION_KEY,
          { content: serializeHomeEquipmentSection(ruSection) },
          'ru',
          true,
        ),
        saveSiteContent(
          HOME_EQUIPMENT_SECTION_KEY,
          { content: serializeHomeEquipmentSection(enSection) },
          'en',
          true,
        ),
      ]);

      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : errorBoundaryContent.savingError);
      return false;
    } finally {
      setSaving(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load, savesVersion]);

  return {
    data,
    staticSection,
    fallbackUsed,
    hasDbRecord,
    loading,
    saving,
    error,
    save,
    initializeFromStatic,
    reload: load,
  };
}
