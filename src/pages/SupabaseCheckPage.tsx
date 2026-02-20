import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SupabaseCheckPage = () => {
  const [tables, setTables] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const expectedTables = ['cases', 'packages', 'categories', 'contacts', 'leads', 'test'];

  useEffect(() => {
    checkTables();
  }, []);

  const checkTables = async () => {
    setLoading(true);
    setError(null);

    const results: Record<string, boolean> = {};

    for (const table of expectedTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        results[table] = !error || (error?.message.includes('relation') === false);
        
        // Если таблица не найдена - это тоже результат
        if (error?.message.includes('relation') || error?.message.includes('schema cache')) {
          results[table] = false;
        } else if (!error) {
          results[table] = true;
        }
      } catch {
        results[table] = false;
      }
    }

    setTables(results);
    setLoading(false);
  };

  const insertTestData = async () => {
    // Тестовые пакеты
    const { error: pkgError } = await supabase.from('packages').insert([
      {
        name: 'Лайт',
        for_formats: ['выставка', 'презентация'],
        includes: ['LED 3x2 м', 'Звук 2 колонки', 'Микрофон'],
        options: ['Доставка', 'Монтаж'],
        price_hint: 'от 50 000 ₽'
      },
      {
        name: 'Медиум',
        for_formats: ['конференция', 'форум'],
        includes: ['LED 5x3 м', 'Звук 4 колонки', 'Микрофоны 2 шт', 'Свет'],
        options: ['Доставка', 'Монтаж', 'Инженер'],
        price_hint: 'от 100 000 ₽'
      },
      {
        name: 'Биг',
        for_formats: ['концерт', 'городское событие'],
        includes: ['LED 10x4 м', 'Звук линейный массив', 'Световое шоу', 'Сцена 8x6 м'],
        options: ['Полный комплект', 'Бригада', 'Резерв'],
        price_hint: 'от 300 000 ₽'
      }
    ]);

    // Тестовые категории
    const { error: catError } = await supabase.from('categories').insert([
      {
        title: 'Световое оборудование',
        short_description: 'Сцена, выставка или банкет с настроенной световой схемой.',
        bullets: ['Подбор по формату площадки', 'Сценический и архитектурный свет', 'Инженер и монтаж'],
        page_path: '/rent/light'
      },
      {
        title: 'Видеооборудование',
        short_description: 'Экраны, проекторы, камеры и коммутация под трансляцию.',
        bullets: ['LED/проекционные решения', 'Плейаут и процессинг', 'Оператор'],
        page_path: '/rent/video'
      },
      {
        title: 'Звуковое оборудование',
        short_description: 'Линейные массивы, мониторы, микшеры, радиосистемы.',
        bullets: ['Расчёт мощности', 'Подбор микшерных пультов', 'Монтаж и настройка'],
        page_path: '/rent/sound'
      }
    ]);

    // Тестовые контакты
    const { error: contactError } = await supabase.from('contacts').insert([{
      phones: ['+7 (912) 246-65-66', '+7 (953) 045-85-58'],
      emails: ['gr@future-screen.ru', 'an@future-screen.ru'],
      address: 'Большой Конный полуостров, 5а, г. Екатеринбург',
      working_hours: 'Ежедневно 10:00–20:00'
    }]);

    alert(`Пакеты: ${pkgError ? '❌ ' + pkgError.message : '✅'}\nКатегории: ${catError ? '❌ ' + catError.message : '✅'}\nКонтакты: ${contactError ? '❌ ' + contactError.message : '✅'}`);
    checkTables();
  };

  return (
    <div className="min-h-screen bg-slate-900 py-10">
      <div className="container-page max-w-4xl">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <h1 className="mb-4 text-2xl font-bold text-white">Проверка таблиц Supabase</h1>

          {loading && <div className="text-slate-300">Загрузка...</div>}
          
          {error && (
            <div className="rounded-lg bg-red-500/10 p-4 text-red-300">
              ❌ Ошибка: {error}
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-500/10 p-4 text-emerald-300">
                ✅ Таблиц найдено: {Object.values(tables).filter(Boolean).length} из {expectedTables.length}
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {expectedTables.map(table => (
                  <div 
                    key={table}
                    className={`rounded-lg p-3 ${
                      tables[table]
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {table} {tables[table] ? '✅' : '❌'}
                  </div>
                ))}
              </div>

              <button
                onClick={insertTestData}
                className="mt-4 w-full rounded-lg bg-brand-500 px-4 py-3 font-semibold text-white hover:bg-brand-400"
              >
                📥 Добавить тестовые данные (пакеты, категории, контакты)
              </button>

              <div className="mt-6 rounded-lg bg-blue-500/10 p-4 text-sm text-blue-200">
                <strong>Ожидаемые таблицы:</strong>
                <ul className="mt-2 list-disc pl-4">
                  <li>cases — кейсы</li>
                  <li>packages — пакеты услуг</li>
                  <li>categories — категории аренды</li>
                  <li>contacts — контакты</li>
                  <li>leads — заявки</li>
                  <li>test — тестовая таблица</li>
                </ul>
                <p className="mt-2 text-xs">
                  Если таблица не найдена (❌) — создай её через SQL Editor в Supabase Dashboard
                </p>
              </div>

              <div className="mt-4">
                <a
                  href="https://supabase.com/dashboard/project/pyframwlnqrzeynqcvle/editor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-400 hover:text-brand-300"
                >
                  → Открыть Supabase Table Editor ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupabaseCheckPage;
