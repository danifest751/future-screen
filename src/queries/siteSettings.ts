/**
 * React Query hooks для работы с настройками сайта.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from './keys';
import type { Database } from '../lib/database.types';

type SiteSettingsRow = Database['public']['Tables']['site_settings']['Row'];

const SETTINGS_ID = 'default';

/**
 * Получить настройки сайта.
 */
export function useSiteSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.siteSettings.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .maybeSingle();

      if (error) throw error;
      return data as SiteSettingsRow | null;
    },
  });
}

/**
 * Сохранить настройки сайта.
 */
export function useSaveSiteSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      background?: string | null;
      background_settings?: Record<string, unknown> | null;
      star_border_settings?: Record<string, unknown> | null;
    }) => {
      const { data, error } = await supabase
        .from('site_settings')
        .upsert({
          id: SETTINGS_ID,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SiteSettingsRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.siteSettings.all });
    },
  });
}
