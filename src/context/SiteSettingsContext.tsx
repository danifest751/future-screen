import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { normalizeSiteSettingsRow, type SiteSettings, type SiteSettingsPatch } from '../lib/siteSettings';
import { useSaveSiteSettingsMutation, useSiteSettingsQuery, useSiteSettingsRealtime } from '../queries/siteSettings';

type SaveResult =
  | { success: true }
  | { success: false; error: unknown };

type SiteSettingsContextValue = {
  settings: SiteSettings;
  loading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  saveSettings: (newSettings: SiteSettingsPatch) => Promise<SaveResult>;
  updateBackground: (background: SiteSettings['background']) => Promise<SaveResult>;
  updateBackgroundSettings: (backgroundSettings: SiteSettings['backgroundSettings']) => Promise<SaveResult>;
  updateStarBorder: (starBorder: Partial<SiteSettings['starBorder']>) => Promise<SaveResult>;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const siteSettingsQuery = useSiteSettingsQuery();
  const saveSiteSettingsMutation = useSaveSiteSettingsMutation();

  useSiteSettingsRealtime();

  const settings = siteSettingsQuery.data ?? normalizeSiteSettingsRow(null);
  const { refetch, isPending, error: queryError } = siteSettingsQuery;
  const { mutateAsync, error: mutationError } = saveSiteSettingsMutation;
  const loading = isPending && !siteSettingsQuery.data;

  const loadSettings = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const saveSettings = useCallback(async (newSettings: SiteSettingsPatch): Promise<SaveResult> => {
    try {
      await mutateAsync(newSettings);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [mutateAsync]);

  const updateBackground = useCallback(async (background: SiteSettings['background']) => {
    return saveSettings({ background });
  }, [saveSettings]);

  const updateBackgroundSettings = useCallback(async (backgroundSettings: SiteSettings['backgroundSettings']) => {
    return saveSettings({ backgroundSettings });
  }, [saveSettings]);

  const updateStarBorder = useCallback(async (starBorder: Partial<SiteSettings['starBorder']>) => {
    return saveSettings({ starBorder });
  }, [saveSettings]);

  const combinedError = mutationError ?? queryError;
  const error = combinedError instanceof Error ? combinedError.message : null;

  const value = useMemo<SiteSettingsContextValue>(() => ({
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
    updateBackground,
    updateBackgroundSettings,
    updateStarBorder,
  }), [
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
    updateBackground,
    updateBackgroundSettings,
    updateStarBorder,
  ]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSiteSettingsContext = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettingsContext must be used within SiteSettingsProvider');
  }
  return context;
};

export default SiteSettingsContext;
