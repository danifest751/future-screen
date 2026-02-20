import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TestRecord {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface Package {
  id: number;
  name: string;
  price_hint: string;
}

interface Category {
  id: number;
  title: string;
  page_path: string;
}

interface Contact {
  id: number;
  phones: string[];
  emails: string[];
}

const SupabaseTestPage = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [tableCreated, setTableCreated] = useState(false);
  
  // Данные для проверки
  const [packages, setPackages] = useState<Package[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [contacts, setContacts] = useState<Contact | null>(null);

  useEffect(() => {
    loadRecords();
    loadSupabaseData();
  }, []);

  const loadRecords = async () => {
    const { data, error } = await supabase.from('test').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setRecords(data);
      setTableCreated(true);
    }
  };

  const loadSupabaseData = async () => {
    // Загружаем пакеты
    const { data: pkgData } = await supabase.from('packages').select('id, name, price_hint');
    if (pkgData) setPackages(pkgData);

    // Загружаем категории
    const { data: catData } = await supabase.from('categories').select('id, title, page_path');
    if (catData) setCategories(catData);

    // Загружаем контакты
    const { data: contactData } = await supabase.from('contacts').select('*').limit(1);
    if (contactData && contactData.length > 0) setContacts(contactData[0]);
  };

  const createTable = async () => {
    setLoading(true);
    setResult('Создание таблицы...');

    const sql = `
      CREATE TABLE IF NOT EXISTS test (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    try {
      // Пробуем создать таблицу через RPC (если есть функция)
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        // Если RPC нет, показываем инструкцию
        setResult('ℹ️ Прямое выполнение SQL недоступно.\n\nСоздай таблицу вручную в Supabase Dashboard:\n\n1. Открой SQL Editor\n2. Вставь этот SQL:\n\n' + sql + '\n3. Нажми Run\n4. Обнови эту страницу');
      }
    } catch (err) {
      setResult('ℹ️ Создай таблицу через SQL Editor в Supabase Dashboard\n\nSQL:\n' + sql);
    }

    setLoading(false);
  };

  const insertTestData = async () => {
    console.log('Adding test data...');

    // Тестовые пакеты
    const { data: pkgData, error: pkgError } = await supabase.from('packages').insert([
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
    ]).select();

    console.log('Packages:', pkgData, pkgError);

    // Тестовые категории
    const { data: catData, error: catError } = await supabase.from('categories').insert([
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
    ]).select();

    console.log('Categories:', catData, catError);

    // Тестовые контакты
    const { data: contactData, error: contactError } = await supabase.from('contacts').insert([{
      phones: ['+7 (912) 246-65-66', '+7 (953) 045-85-58'],
      emails: ['gr@future-screen.ru', 'an@future-screen.ru'],
      address: 'Большой Конный полуостров, 5а, г. Екатеринбург',
      working_hours: 'Ежедневно 10:00–20:00'
    }]).select();

    console.log('Contacts:', contactData, contactError);

    const messages = [];
    messages.push(`Пакеты: ${pkgError ? '❌ ' + pkgError.message : '✅ ' + pkgData?.length + ' добавлено'}`);
    messages.push(`Категории: ${catError ? '❌ ' + catError.message : '✅ ' + catData?.length + ' добавлено'}`);
    messages.push(`Контакты: ${contactError ? '❌ ' + contactError.message : '✅ ' + contactData?.length + ' добавлено'}`);

    alert(messages.join('\n'));
    loadSupabaseData();
  };

  const createRecord = async () => {
    if (!formData.name) return;
    
    const { data, error } = await supabase.from('test').insert([{
      name: formData.name,
      email: formData.email || null,
    }]).select();

    if (!error && data) {
      setRecords([data[0], ...records]);
      setFormData({ name: '', email: '' });
      setResult('✅ Запись добавлена!');
    } else {
      setResult('❌ Ошибка: ' + (error?.message || 'Неизвестная ошибка'));
    }
  };

  const updateRecord = async (id: number) => {
    const { error } = await supabase.from('test').update({
      name: formData.name,
      email: formData.email,
    }).eq('id', id);

    if (!error) {
      loadRecords();
      setEditingId(null);
      setFormData({ name: '', email: '' });
      setResult('✅ Запись обновлена!');
    } else {
      setResult('❌ Ошибка: ' + error.message);
    }
  };

  const deleteRecord = async (id: number) => {
    if (!confirm('Удалить эту запись?')) return;

    const { error } = await supabase.from('test').delete().eq('id', id);

    if (!error) {
      setRecords(records.filter(r => r.id !== id));
      setResult('✅ Запись удалена!');
    } else {
      setResult('❌ Ошибка: ' + error.message);
    }
  };

  const startEdit = (record: TestRecord) => {
    setEditingId(record.id);
    setFormData({ name: record.name, email: record.email || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', email: '' });
  };

  const testConnection = async () => {
    setLoading(true);
    setResult('Проверка подключения...');

    try {
      // Простой запрос к Supabase - проверка что соединение работает
      const { data, error } = await supabase.from('_prisma_migrations').select('*').limit(1);

      if (error) {
        // Ошибка "table doesn't exist" означает что подключение РАБОТАЕТ
        if (error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('schema cache')) {
          setResult('✅ ПОДКЛЮЧЕНИЕ УСПЕШНО!\n\nБаза данных работает и отвечает.\n\n⚠️ Таблица _prisma_migrations не найдена — это нормально для новой базы.\n\n📋 Следующие шаги:\n1. Создай таблицы через SQL Editor в Supabase Dashboard\n2. Или используй Prisma для миграций\n3. Или создай тестовую таблицу (кнопка ниже)');
        } else {
          setResult(`⚠️ Подключение есть, но ошибка:\n${error.message}`);
        }
      } else {
        setResult(`✅ Подключение успешно!\n\nДанные из базы:\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      setResult(`❌ Ошибка подключения:\n${String(err)}`);
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

            {!tableCreated && (
              <button
                onClick={createTable}
                disabled={loading}
                className="w-full rounded-lg bg-purple-500 px-4 py-3 font-semibold text-white hover:bg-purple-400 disabled:opacity-50"
              >
                3. Создать тестовую таблицу
              </button>
            )}
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
              <li>Если таблица не найдена — нажми "Создать тестовую таблицу"</li>
              <li>Появится CRUD интерфейс для добавления/редактирования записей</li>
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

        {/* CRUD тестовая таблица */}
        {tableCreated && (
          <div className="mt-6 rounded-xl border border-white/10 bg-slate-800 p-6">
            <h2 className="mb-4 text-xl font-bold text-white">📋 Тестовая таблица (CRUD)</h2>

            {/* Форма добавления/редактирования */}
            <div className="mb-6 grid gap-3 md:grid-cols-3">
              <input
                type="text"
                placeholder="Имя *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
              />
              <div className="flex gap-2">
                {editingId ? (
                  <>
                    <button
                      onClick={() => updateRecord(editingId)}
                      className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
                    >
                      Отмена
                    </button>
                  </>
                ) : (
                  <button
                    onClick={createRecord}
                    className="flex-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400"
                  >
                    Добавить
                  </button>
                )}
              </div>
            </div>

            {/* Список записей */}
            <div className="space-y-2">
              {records.length === 0 ? (
                <div className="rounded-lg bg-white/5 p-4 text-center text-slate-400">
                  Записей нет. Добавь первую!
                </div>
              ) : (
                records.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                  >
                    <div>
                      <div className="font-medium text-white">{record.name}</div>
                      <div className="text-sm text-slate-400">{record.email || '—'}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(record.created_at).toLocaleString('ru-RU')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(record)}
                        className="rounded border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-white/40"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteRecord(record.id)}
                        className="rounded border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 hover:border-red-400"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Проверка данных из Supabase */}
        <div className="mt-6 rounded-xl border border-white/10 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-bold text-white">📊 Данные из Supabase</h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            {/* Пакеты */}
            <div className="rounded-lg bg-white/5 p-4">
              <h3 className="mb-2 font-semibold text-white">Пакеты ({packages.length})</h3>
              {packages.length === 0 ? (
                <p className="text-sm text-slate-400">Нет данных</p>
              ) : (
                <ul className="text-sm text-slate-300 space-y-1">
                  {packages.map(p => (
                    <li key={p.id}>• {p.name} <span className="text-slate-500">({p.price_hint})</span></li>
                  ))}
                </ul>
              )}
            </div>

            {/* Категории */}
            <div className="rounded-lg bg-white/5 p-4">
              <h3 className="mb-2 font-semibold text-white">Категории ({categories.length})</h3>
              {categories.length === 0 ? (
                <p className="text-sm text-slate-400">Нет данных</p>
              ) : (
                <ul className="text-sm text-slate-300 space-y-1">
                  {categories.map(c => (
                    <li key={c.id} className="truncate">• {c.title}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Контакты */}
            <div className="rounded-lg bg-white/5 p-4">
              <h3 className="mb-2 font-semibold text-white">Контакты</h3>
              {!contacts ? (
                <p className="text-sm text-slate-400">Нет данных</p>
              ) : (
                <div className="text-sm text-slate-300">
                  <p>📞 {contacts.phones?.[0]}</p>
                  <p>✉️ {contacts.emails?.[0]}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={loadSupabaseData}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400"
            >
              🔄 Обновить данные
            </button>
            <button
              onClick={insertTestData}
              disabled={loading}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
            >
              📥 Добавить тестовые данные
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseTestPage;
