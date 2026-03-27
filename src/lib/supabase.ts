import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Ошибка: VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY должны быть заданы в переменных окружения.\n' +
    'Для локальной разработки создайте файл .env с этими переменными.\n' +
    'Для продакшена добавьте их в настройки Vercel.'
  );
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? ''
);
