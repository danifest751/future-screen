/**
 * React Query hooks для работы с политикой конфиденциальности.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from './keys';
import type { Database } from '../lib/database.types';

type SiteContentRow = Database['public']['Tables']['site_content']['Row'];

const PRIVACY_KEY = 'privacy_policy';

/**
 * Получить политику конфиденциальности.
 */
export function usePrivacyPolicyQuery() {
  return useQuery({
    queryKey: queryKeys.privacyPolicy.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('key', PRIVACY_KEY)
        .single();

      if (error) throw error;
      return data as SiteContentRow;
    },
  });
}

/**
 * Сохранить политику конфиденциальности.
 */
export function useSavePrivacyPolicyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      content: string;
      metaTitle?: string | null;
      metaDescription?: string | null;
      fontSize?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('site_content')
        .upsert({
          key: PRIVACY_KEY,
          title: input.title,
          content: input.content,
          meta_title: input.metaTitle,
          meta_description: input.metaDescription,
          font_size: input.fontSize,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SiteContentRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.privacyPolicy.all });
    },
  });
}
