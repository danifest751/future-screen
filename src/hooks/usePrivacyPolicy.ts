import { useCallback, useEffect, useState } from 'react';
import { loadSiteContent, saveSiteContent, type SiteContent } from '../services/siteContent';

const CONTENT_KEY = 'privacy_policy';

export function usePrivacyPolicy() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadSiteContent(CONTENT_KEY);
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (input: Parameters<typeof saveSiteContent>[1]) => {
    setSaving(true);
    setError(null);
    try {
      const data = await saveSiteContent(CONTENT_KEY, input);
      setContent(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    content,
    loading,
    error,
    saving,
    save,
    reload: load,
  };
}
