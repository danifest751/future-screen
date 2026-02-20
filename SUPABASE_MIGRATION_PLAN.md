# План миграции Future Screen на Supabase

**Бесплатный тариф** — все возможности без привязки карты

---

## 📊 Что переносим на Supabase

### 1. Контент (сейчас в JSON/TS файлах)
- ✅ Кейсы (`src/data/cases.ts`)
- ✅ Пакеты услуг (`src/data/packages.ts`)
- ✅ Категории аренды (`src/data/categories.ts`)
- ✅ Контакты (`src/data/contacts.ts`)
- ✅ Настройки калькулятора (`src/data/calculatorConfig.ts`)

### 2. Заявки (сейчас в localStorage)
- ✅ Лента заявок из админки (`/admin/leads`)
- ✅ Экспорт в CSV/JSON

### 3. Пользователи (сейчас sessionStorage)
- ✅ Админка (логин/пароль)
- ✅ Сессии

---

## 🗄️ Структура базы данных

### Таблица: `cases` (Кейсы)
```sql
CREATE TABLE cases (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  city TEXT,
  date TEXT,
  format TEXT,
  services TEXT[], -- массив строк: ['led', 'sound']
  summary TEXT,
  metrics TEXT,
  images TEXT[], -- массив URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Таблица: `packages` (Пакеты услуг)
```sql
CREATE TABLE packages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL, -- "Лайт", "Медиум", "Биг"
  for_formats TEXT[], -- ["выставка", "конференция"]
  includes TEXT[], -- что входит
  options TEXT[], -- опции
  price_hint TEXT, -- "от 50 000 ₽"
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Таблица: `categories` (Категории аренды)
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  short_description TEXT,
  bullets TEXT[], -- преимущества
  page_path TEXT UNIQUE, -- "/rent/light"
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Таблица: `contacts` (Контакты)
```sql
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  phones TEXT[], -- ["+79122466566"]
  emails TEXT[], -- ["gr@future-screen.ru"]
  address TEXT,
  working_hours TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Одна запись с контактами
INSERT INTO contacts (phones, emails, address, working_hours)
VALUES (
  ARRAY['+7 (912) 246-65-66', '+7 (953) 045-85-58'],
  ARRAY['gr@future-screen.ru', 'an@future-screen.ru'],
  'Большой Конный полуостров, 5а, г. Екатеринбург',
  'Ежедневно 10:00–20:00'
);
```

### Таблица: `calculator_config` (Настройки калькулятора)
```sql
CREATE TABLE calculator_config (
  id SERIAL PRIMARY KEY,
  pitch_options JSONB, -- [{label, value, minDistance, maxDistance, description, stockArea}]
  size_presets JSONB, -- [{label, width, height}]
  screen_products JSONB, -- [{id, label, location, pitch, cabinetW, cabinetH, powerWPerM2, pricePerM2, availableArea}]
  cost_params JSONB, -- {assemblyCostPerM2, technicianPerDay, engineerPerDay, discountFactors}
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Таблица: `leads` (Заявки)
```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL, -- "Форма КП (/contacts)"
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  telegram TEXT,
  city TEXT,
  date TEXT,
  format TEXT,
  comment TEXT,
  extra JSONB, -- доп. данные из калькулятора
  status TEXT DEFAULT 'new', -- "new", "in_progress", "completed"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_leads_status ON leads(status);
```

### Таблица: `admin_users` (Администраторы)
```sql
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создаём админа (пароль хешируем bcrypt)
-- Пароль по умолчанию: fs2024
INSERT INTO admin_users (username, password_hash)
VALUES ('admin', '$2b$10$...'); -- хеш пароля
```

---

## 📝 Пошаговый план миграции

### Этап 1: Подготовка (1-2 часа)

#### 1.1 Создать таблицы в Supabase
1. Открой https://supabase.com/dashboard/project/pyframwlnqrzeynqcvle
2. Перейди в **SQL Editor**
3. Создай все таблицы (SQL выше)
4. Проверь что все таблицы созданы

#### 1.2 Настроить RLS (Row Level Security)
```sql
-- Разрешить чтение всем (для публичного контента)
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON cases FOR SELECT USING (true);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON packages FOR SELECT USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON categories FOR SELECT USING (true);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON contacts FOR SELECT USING (true);

ALTER TABLE calculator_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON calculator_config FOR SELECT USING (true);

-- Заявки: чтение только для админов
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read" ON leads FOR SELECT USING (true); -- пока всем, потом ограничим
CREATE POLICY "Public insert" ON leads FOR INSERT WITH CHECK (true);

-- Админка: пока без ограничений (потом добавим auth)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
```

#### 1.3 Заполнить начальными данными
```sql
-- Пакеты
INSERT INTO packages (name, for_formats, includes, options, price_hint) VALUES
('Лайт', ARRAY['выставка', 'презентация'], ARRAY['LED 3x2 м', 'Звук 2 колонки', 'Микрофон'], ARRAY['Доставка', 'Монтаж'], 'от 50 000 ₽'),
('Медиум', ARRAY['конференция', 'форум'], ARRAY['LED 5x3 м', 'Звук 4 колонки', 'Микрофоны 2 шт', 'Свет'], ARRAY['Доставка', 'Монтаж', 'Инженер'], 'от 100 000 ₽'),
('Биг', ARRAY['концерт', 'городское событие'], ARRAY['LED 10x4 м', 'Звук линейный массив', 'Световое шоу', 'Сцена 8x6 м'], ARRAY['Полный комплект', 'Бригада', 'Резерв'], 'от 300 000 ₽');

-- Категории
INSERT INTO categories (title, short_description, bullets, page_path) VALUES
('Световое оборудование', 'Сцена, выставка или банкет с настроенной световой схемой.', ARRAY['Подбор по формату площадки', 'Сценический и архитектурный свет', 'Инженер и монтаж'], '/rent/light'),
('Видеооборудование', 'Экраны, проекторы, камеры и коммутация под трансляцию.', ARRAY['LED/проекционные решения', 'Плейаут и процессинг', 'Оператор'], '/rent/video'),
('Звуковое оборудование', 'Линейные массивы, мониторы, микшеры, радиосистемы.', ARRAY['Расчёт мощности', 'Подбор микшерных пультов', 'Монтаж и настройка'], '/rent/sound'),
('Сцены и подиумы', 'Сцены, порталы, подиумы, пультовые башни.', ARRAY['Типовые конфигурации', 'Лебёдки и ограждения', 'Монтаж/логистика'], '/rent/stage'),
('Музыкальные инструменты', 'Барабаны, клавиши, гитары, бэклайн.', ARRAY['Комплект под жанр', 'Сервирование', 'Доставка'], '/rent/instruments');

-- Контакты (уже есть в SQL выше)

-- Калькулятор (базовая конфигурация)
INSERT INTO calculator_config (pitch_options, size_presets, screen_products, cost_params) VALUES
('[{"label":"P2.6","value":2.6,"minDistance":0,"maxDistance":3,"description":"Близкий просмотр","stockArea":150}]'::jsonb,
 '[{"label":"16:9 — 4.0 × 2.25 м","width":4,"height":2.25}]'::jsonb,
 '[{"id":"indoor-p2.6","label":"Помещение P2.6","location":"indoor","pitch":2.6,"cabinetW":0.5,"cabinetH":0.5,"powerWPerM2":700,"pricePerM2":8500,"availableArea":150}]'::jsonb,
 '{"assemblyCostPerM2":1500,"technicianPerDay":8000,"engineerPerDay":20000,"discountFactors":[1,0.5,0.4,0.3]}'::jsonb);
```

---

### Этап 2: Миграция контента (2-3 часа)

#### 2.1 Создать хуки для работы с Supabase

**Файл:** `src/hooks/useCases.ts` (обновить текущий)
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useCases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) setCases(data);
      setLoading(false);
    };

    fetchCases();
  }, []);

  const addCase = async (caseData) => {
    const { data, error } = await supabase
      .from('cases')
      .insert([caseData])
      .select();
    
    if (!error) setCases([data[0], ...cases]);
    return { data, error };
  };

  const updateCase = async (slug, updates) => {
    const { data, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('slug', slug)
      .select();
    
    if (!error) {
      setCases(cases.map(c => c.slug === slug ? data[0] : c));
    }
    return { data, error };
  };

  const deleteCase = async (slug) => {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('slug', slug);
    
    if (!error) setCases(cases.filter(c => c.slug !== slug));
    return { error };
  };

  return { cases, loading, addCase, updateCase, deleteCase };
};
```

#### 2.2 Обновить остальные хуки
- `src/hooks/usePackages.ts` — аналогично
- `src/hooks/useCategories.ts` — аналогично
- `src/hooks/useContacts.ts` — аналогично

#### 2.3 Перенести данные из JSON в базу
1. Экспортировать текущие данные из `src/data/*.ts`
2. Импортировать через SQL Editor или Dashboard

---

### Этап 3: Миграция заявок (1-2 часа)

#### 3.1 Обновить отправку форм

**Файл:** `src/lib/submitForm.ts`
```typescript
export const submitForm = async (payload: FormPayload) => {
  // Сохраняем в Supabase
  const { error: dbError } = await supabase
    .from('leads')
    .insert([{
      source: payload.source,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      telegram: payload.telegram,
      city: payload.city,
      date: payload.date,
      format: payload.format,
      comment: payload.comment,
      extra: payload.extra,
      status: 'new'
    }]);

  // Параллельно отправляем email/telegram
  // ... (текущий код)
  
  return { ok: !dbError };
};
```

#### 3.2 Обновить админку заявок

**Файл:** `src/pages/admin/AdminLeadsPage.tsx`
```typescript
// Загрузка из Supabase вместо localStorage
useEffect(() => {
  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setLogs(data);
  };
  
  fetchLeads();
}, []);
```

---

### Этап 4: Аутентификация админки (2-3 часа)

#### 4.1 Использовать Supabase Auth (опционально)
```typescript
// Вместо sessionStorage
import { supabase } from '../lib/supabase';

const login = async (username: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: `${username}@admin.local`,
    password,
  });
  
  return !error;
};
```

#### 4.2 Или оставить простую аутентификацию
- Текущая система через sessionStorage
- Хеш пароля хранить в `admin_users`

---

### Этап 5: Тестирование (1-2 часа)

#### Чек-лист:
- [ ] Кейсы загружаются с сайта
- [ ] Пакеты отображаются на `/prices`
- [ ] Категории на `/rent`
- [ ] Контакты на `/contacts`
- [ ] Калькулятор считает
- [ ] Заявки сохраняются в `leads`
- [ ] Админка показывает заявки
- [ ] Экспорт CSV работает
- [ ] Админка редактирует контент

---

## 💰 Стоимость (бесплатный тариф)

### Supabase Free Tier:
- ✅ **500 MB** база данных
- ✅ **50 000** месячных активных пользователей
- ✅ **2 GB** bandwidth
- ✅ **500 MB** файловое хранилище
- ✅ **60 часов** Edge Functions в месяц

**Хватит для:**
- ~10 000 кейсов/пакетов/категорий
- ~50 000 заявок в месяц
- ~100 000 посещений сайта

**Цена:** $0/месяц (бесплатно)

---

## 📅 Таймлайн

| Этап | Время | Результат |
|------|-------|-----------|
| 1. Подготовка | 1-2 часа | Таблицы созданы |
| 2. Миграция контента | 2-3 часа | Хуки обновлены |
| 3. Миграция заявок | 1-2 часа | Заявки в базе |
| 4. Аутентификация | 2-3 часа | Вход работает |
| 5. Тестирование | 1-2 часа | Всё работает |

**Итого:** 7-12 часов работы

---

## 🚀 Деплой

1. Закоммитить изменения
2. Push на GitHub
3. Vercel задеплоит автоматически
4. Проверить что всё работает

---

## 📝 SQL для быстрого старта

Скопируй и выполни в SQL Editor:

```sql
-- Все таблицы сразу
CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  city TEXT,
  date TEXT,
  format TEXT,
  services TEXT[],
  summary TEXT,
  metrics TEXT,
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  for_formats TEXT[],
  includes TEXT[],
  options TEXT[],
  price_hint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  short_description TEXT,
  bullets TEXT[],
  page_path TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  phones TEXT[],
  emails TEXT[],
  address TEXT,
  working_hours TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calculator_config (
  id SERIAL PRIMARY KEY,
  pitch_options JSONB,
  size_presets JSONB,
  screen_products JSONB,
  cost_params JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  telegram TEXT,
  city TEXT,
  date TEXT,
  format TEXT,
  comment TEXT,
  extra JSONB,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_slug ON cases(slug);

-- RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON cases FOR SELECT USING (true);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON packages FOR SELECT USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON categories FOR SELECT USING (true);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON contacts FOR SELECT USING (true);

ALTER TABLE calculator_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON calculator_config FOR SELECT USING (true);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read" ON leads FOR SELECT USING (true);
CREATE POLICY "Public insert" ON leads FOR INSERT WITH CHECK (true);
```

---

## ✅ Готово!

После выполнения плана:
- ✅ Весь контент в базе
- ✅ Заявки сохраняются в Supabase
- ✅ Админка работает с базой
- ✅ Бесплатный тариф покрывает все потребности
- ✅ Масштабируемо на будущее
