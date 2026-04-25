/**
 * React Query hooks для работы с политикой конфиденциальности.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from './keys';
import type { Database } from '../lib/database.types';
import type { Locale } from '../i18n/types';

type SiteContentRow = Database['public']['Tables']['site_content']['Row'];

const PRIVACY_KEY = 'privacy_policy';

/**
 * Получить политику конфиденциальности.
 */
export function usePrivacyPolicyQuery(locale: Locale = 'ru') {
  return useQuery({
    queryKey: queryKeys.privacyPolicy.all(locale),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('key', PRIVACY_KEY)
        .single();

      if (error) throw error;
      const row = data as SiteContentRow;
      if (locale !== 'en') return row;

      return {
        ...row,
        title: row.title_en,
        content: row.content_en,
        content_html: row.content_html_en,
        meta_title: row.meta_title_en,
        meta_description: row.meta_description_en,
        font_size: row.font_size_en,
      } as SiteContentRow;
    },
  });
}

/**
 * Сохранить политику конфиденциальности.
 */
export function useSavePrivacyPolicyMutation(locale: Locale = 'ru') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      content: string;
      metaTitle?: string | null;
      metaDescription?: string | null;
      fontSize?: string | null;
    }) => {
      const payload =
        locale === 'en'
          ? {
              key: PRIVACY_KEY,
              title_en: input.title,
              content_en: input.content,
              meta_title_en: input.metaTitle,
              meta_description_en: input.metaDescription,
              font_size_en: input.fontSize,
            }
          : {
              key: PRIVACY_KEY,
              title: input.title,
              content: input.content,
              meta_title: input.metaTitle,
              meta_description: input.metaDescription,
              font_size: input.fontSize,
            };

      const { data, error } = await supabase
        .from('site_content')
        .upsert(payload, { onConflict: 'key' })
        .select()
        .single();

      if (error) throw error;
      return data as SiteContentRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.privacyPolicy.all(locale) });
    },
  });
}
