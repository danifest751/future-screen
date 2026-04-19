import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  LEGACY_SITE_SETTINGS_ID,
  normalizeSiteSettingsRow,
  selectPreferredSiteSettingsRow,
  SITE_SETTINGS_ID,
  type SiteSettings,
  type SiteSettingsPatch,
  type SiteSettingsRow,
} from '../lib/siteSettings';
import { queryKeys } from './keys';

const siteSettingsDefaultsJson = {
  enabled: false,
  color: '#8aa2ff',
  speed: 6,
  thickness: 2.5,
  intensity: 1,
  cornerOffset: 0,
};

const getNextSiteSettings = (current: SiteSettings, patch: SiteSettingsPatch): SiteSettings => ({
  background: patch.background ?? current.background,
  backgroundSettings: patch.backgroundSettings ?? current.backgroundSettings,
  starBorder: patch.starBorder
    ? {
        ...current.starBorder,
        ...patch.starBorder,
      }
    : current.starBorder,
});

const fetchSiteSettingsRows = async () => {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .in('id', [SITE_SETTINGS_ID, LEGACY_SITE_SETTINGS_ID]);

  if (error) throw error;
  return (data ?? []) as SiteSettingsRow[];
};

export const fetchSiteSettings = async (): Promise<SiteSettings> => {
  const rows = await fetchSiteSettingsRows();
  const preferredRow = selectPreferredSiteSettingsRow(rows);
  return normalizeSiteSettingsRow(preferredRow);
};

export function useSiteSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.siteSettings.all,
    queryFn: fetchSiteSettings,
  });
}

export function useSaveSiteSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: SiteSettingsPatch) => {
      const current =
        queryClient.getQueryData<SiteSettings>(queryKeys.siteSettings.all) ??
        normalizeSiteSettingsRow(null);
      const next = getNextSiteSettings(current, patch);

      const { error } = await supabase.from('site_settings').upsert(
        {
          id: SITE_SETTINGS_ID,
          background: next.background,
          background_settings: next.backgroundSettings,
          star_border_settings: {
            ...siteSettingsDefaultsJson,
            ...next.starBorder,
          },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
        },
      );

      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.siteSettings.all, next);
      queryClient.invalidateQueries({ queryKey: queryKeys.siteSettings.all });
    },
  });
}

export function useSiteSettingsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('site_settings_changes_query')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
        },
        (payload) => {
          const row = (payload.new as { id?: string } | null) ?? (payload.old as { id?: string } | null);
          const id = row?.id;
          if (id === SITE_SETTINGS_ID || id === LEGACY_SITE_SETTINGS_ID) {
            queryClient.invalidateQueries({ queryKey: queryKeys.siteSettings.all });
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);
}

