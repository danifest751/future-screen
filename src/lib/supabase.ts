import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] URL или ключ не настроены в .env');
}

export const supabase = createClient(
  supabaseUrl || 'https://pyframwlnqrzeynqcvle.supabase.co',
  supabaseAnonKey || '***REDACTED_SUPABASE_ANON_KEY***'
);
