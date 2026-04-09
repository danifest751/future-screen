import { useCallback, useEffect, useState } from 'react';
import { errorBoundaryContent } from '../content/components/errorBoundary';
import { loadSiteContent, saveSiteContent, type SiteContent } from '../services/siteContent';
import type { Locale } from '../i18n/types';

const CONTENT_KEY = 'privacy_policy';

export function usePrivacyPolicy(locale: Locale = 'ru', fallbackToRu = true) {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadSiteContent(CONTENT_KEY, locale, fallbackToRu);
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorBoundaryContent.loadingError);
    } finally {
      setLoading(false);
    }
  }, [fallbackToRu, locale]);

  const save = useCallback(async (input: Parameters<typeof saveSiteContent>[1]) => {
    setSaving(true);
    setError(null);
    try {
      const data = await saveSiteContent(CONTENT_KEY, input, locale, fallbackToRu);
      setContent(data);
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
    content,
    fallbackUsed: content?.fallbackUsed ?? false,
    loading,
    error,
    saving,
    save,
    reload: load,
  };
}
