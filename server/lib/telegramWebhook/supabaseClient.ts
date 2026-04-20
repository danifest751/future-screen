import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export const hasServiceRole = (): boolean => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

export const getSupabaseClient = (): SupabaseClient => {
  if (!cached) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRole) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured ' +
          '(anon-key fallback was removed — service role is required for writes)',
      );
    }

    cached = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  }
  return cached;
};

export const __resetSupabaseClientForTests = () => {
  cached = null;
};
