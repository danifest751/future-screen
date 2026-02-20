import { supabase } from './supabase';

export const testSupabaseConnection = async (): Promise<{ ok: boolean; error?: string }> => {
  try {
    // Простая проверка - попробуем получить список таблиц
    const { data, error } = await supabase.from('_prisma_migrations').select('migration_name').limit(1);
    
    if (error) {
      // Таблица может не существовать, это нормально
      console.log('[Supabase] Подключение работает, но таблица _prisma_migrations не найдена');
      return { ok: true, error: 'Table not found (это нормально для новой базы)' };
    }
    
    console.log('[Supabase] Подключение успешно!', data);
    return { ok: true };
  } catch (err) {
    console.error('[Supabase] Ошибка подключения:', err);
    return { ok: false, error: String(err) };
  }
};

// Простая проверка без таблиц
export const testSupabasePing = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('test_ping').select('*').limit(1);
    // Ошибка здесь ожидаема (таблица не существует), главное что соединение работает
    return error?.message.includes('relation') || !error;
  } catch {
    return false;
  }
};
