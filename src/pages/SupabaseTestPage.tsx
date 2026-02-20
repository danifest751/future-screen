import { useState } from 'react';
import { supabase } from '../lib/supabase';

const SupabaseTestPage = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('Проверка подключения...');

    try {
      // Простой запрос к Supabase
      const { data, error } = await supabase.from('_prisma_migrations').select('*').limit(1);

      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          setResult('✅ Подключение успешно!\n\nБаза работает, но таблица _prisma_migrations не найдена (это нормально для новой базы).\n\nПопробуй создать таблицу через SQL Editor в Supabase Dashboard.');
        } else {
          setResult(`⚠️ Ошибка: ${error.message}`);
        }
      } else {
        setResult(`✅ Подключение успешно!\n\nДанные из базы:\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      setResult(`❌ Ошибка подключения:\n${String(err)}`);
    }

    setLoading(false);
  };

  const testSimpleQuery = async () => {
    setLoading(true);
    setResult('Выполнение простого запроса...');

    try {
      // Создадим тестовую таблицу если нет
      const { error: createError } = await supabase.rpc('create_test_table');
      
      if (createError && !createError.message.includes('already exists')) {
        // Если функция не существует, пробуем создать таблицу напрямую
        setResult('ℹ️ RPC функция не найдена. Попробуй создать таблицу вручную в Supabase Dashboard:\n\nCREATE TABLE test (\n  id SERIAL PRIMARY KEY,\n  name TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nINSERT INTO test (name) VALUES (\'Test from Future Screen\');');
      }
    } catch (err) {
      setResult(`ℹ️ Для теста создай таблицу вручную:\n\nCREATE TABLE test (\n  id SERIAL PRIMARY KEY,\n  name TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);`);
    }

    setLoading(false);
  };

  const checkEnvVars = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      setResult('❌ Переменные окружения не настроены!\n\nVITE_SUPABASE_URL: ' + (url ? '✓' : '✗') + '\nVITE_SUPABASE_ANON_KEY: ' + (key ? '✓' : '✗'));
    } else {
      setResult('✅ Переменные окружения настроены!\n\nURL: ' + url + '\nKey: ' + (key.substring(0, 20) + '...'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-10">
      <div className="container-page max-w-3xl">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <h1 className="mb-4 text-2xl font-bold text-white">Тест подключения Supabase</h1>
          
          <div className="mb-6 space-y-3">
            <button
              onClick={checkEnvVars}
              disabled={loading}
              className="w-full rounded-lg bg-brand-500 px-4 py-3 font-semibold text-white hover:bg-brand-400 disabled:opacity-50"
            >
              1. Проверить переменные окружения
            </button>

            <button
              onClick={testConnection}
              disabled={loading}
              className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
            >
              2. Тест подключения к базе
            </button>

            <button
              onClick={testSimpleQuery}
              disabled={loading}
              className="w-full rounded-lg bg-purple-500 px-4 py-3 font-semibold text-white hover:bg-purple-400 disabled:opacity-50"
            >
              3. SQL для создания таблицы
            </button>
          </div>

          {loading && (
            <div className="rounded-lg bg-white/5 p-4 text-center text-slate-300">
              Загрузка...
            </div>
          )}

          {result && (
            <pre className="whitespace-pre-wrap rounded-lg bg-black/50 p-4 text-sm text-emerald-300">
              {result}
            </pre>
          )}

          <div className="mt-6 rounded-lg bg-blue-500/10 p-4 text-sm text-blue-200">
            <strong>Инструкция:</strong>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Нажми "Проверить переменные окружения"</li>
              <li>Нажми "Тест подключения к базе"</li>
              <li>Если таблица не найдена — создай её через SQL Editor в Supabase Dashboard</li>
              <li>Повтори тест подключения</li>
            </ol>
          </div>

          <div className="mt-4">
            <a
              href="https://supabase.com/dashboard/project/pyframwlnqrzeynqcvle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-400 hover:text-brand-300"
            >
              → Открыть Supabase Dashboard ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseTestPage;
