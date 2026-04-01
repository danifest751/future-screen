import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { BackgroundId, BackgroundSettingsById, StarBorderSettings } from '../lib/backgrounds';
import { defaultBackgroundSettingsById, defaultStarBorderSettings } from '../lib/backgrounds';

export type SiteSettings = {
  background: BackgroundId;
  backgroundSettings: BackgroundSettingsById;
  starBorder: StarBorderSettings;
};

const DEFAULT_SETTINGS: SiteSettings = {
  background: 'theme',
  backgroundSettings: { ...defaultBackgroundSettingsById },
  starBorder: { ...defaultStarBorderSettings },
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка настроек из Supabase
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (supabaseError) {
        // Если записи нет, используем дефолтные
        if (supabaseError.code === 'PGRST116') {
          console.log('[useSiteSettings] Настройки не найдены, используем дефолтные');
          return;
        }
        throw supabaseError;
      }

      if (data) {
        setSettings({
          background: data.background || DEFAULT_SETTINGS.background,
          backgroundSettings: {
            ...DEFAULT_SETTINGS.backgroundSettings,
            ...(data.background_settings || {}),
          },
          starBorder: {
            ...DEFAULT_SETTINGS.starBorder,
            ...(data.star_border_settings || {}),
          },
        });
      }
    } catch (err) {
      console.error('[useSiteSettings] Ошибка загрузки:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Сохранение настроек в Supabase
  const saveSettings = useCallback(async (newSettings: Partial<SiteSettings>) => {
    try {
      setError(null);

      const updatedSettings = {
        ...settings,
        ...newSettings,
      };

      const { error: upsertError } = await supabase
        .from('site_settings')
        .upsert({
          id: 'default',
          background: updatedSettings.background,
          background_settings: updatedSettings.backgroundSettings,
          star_border_settings: updatedSettings.starBorder,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (upsertError) {
        throw upsertError;
      }

      setSettings(updatedSettings);
      return { success: true };
    } catch (err) {
      console.error('[useSiteSettings] Ошибка сохранения:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return { success: false, error: err };
    }
  }, [settings]);

  // Обновление только фона
  const updateBackground = useCallback(async (background: BackgroundId) => {
    return saveSettings({ background });
  }, [saveSettings]);

  // Обновление настроек фона
  const updateBackgroundSettings = useCallback(async (settingsMap: BackgroundSettingsById) => {
    return saveSettings({ backgroundSettings: settingsMap });
  }, [saveSettings]);

  // Обновление настроек Star Border
  const updateStarBorder = useCallback(async (starBorder: Partial<StarBorderSettings>) => {
    return saveSettings({
      starBorder: { ...settings.starBorder, ...starBorder }
    });
  }, [saveSettings, settings.starBorder]);

  // Подписка на изменения в реальном времени
  useEffect(() => {
    loadSettings();

    // Подписка на изменения
    const subscription = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'id=eq.default',
        },
        (payload) => {
          console.log('[useSiteSettings] Получены изменения:', payload);
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
    updateBackground,
    updateBackgroundSettings,
    updateStarBorder,
  };
};

export default useSiteSettings;
