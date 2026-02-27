# Аудит проекта Future Screen

**Дата аудита:** 27 февраля 2026 г.  
**Актуализация:** 27 февраля 2026 г. (после рефакторинга админки и миграции на Supabase)  
**Проект:** future-screen.ru — техсопровождение мероприятий (LED, звук, свет, сцены)  
**Стек:** React 18 + TypeScript + Vite + TailwindCSS + React Router

---

## 1. Общая информация

### 1.1 О проекте
Веб-сайт компании «Future Screen», предоставляющей услуги техсопровождения мероприятий:
- Аренда LED-экранов и сценического оборудования
- Консультации и услуги специалистов
- Техсопровождение мероприятий «под ключ»
- Производство/установка/обслуживание LED-экранов

**География:** РФ (Екатеринбург, Москва, Тюмень и др.)  
**Опыт:** с 2007 года

### 1.2 Технический стек

| Категория | Технология | Версия |
|-----------|------------|--------|
| Фреймворк | React | 18.2.0 |
| Язык | TypeScript | 5.4.2 |
| Сборщик | Vite | 5.1.4 |
| Роутинг | React Router | 6.22.3 |
| Стили | TailwindCSS | 3.4.1 |
| Формы | React Hook Form | 7.51.5 |
| Валидация | Zod | 3.22.4 |
| Сервер | Express | 5.2.1 |
| Почта | Nodemailer | 8.0.1 |
| Тесты | Vitest | 4.0.18 |

### 1.3 Структура проекта

```
c:\FS-GPT\
├── src/
│   ├── components/       # UI-компоненты (20+ файлов)
│   ├── context/          # AuthContext, ThemeContext
│   ├── data/             # Данные (calculatorConfig, cases, categories...)
│   ├── hooks/            # Кастомные хуки (5 файлов)
│   ├── lib/              # Утилиты (analytics, email, submitForm, telegram)
│   ├── pages/            # Страницы (13 + admin/)
│   ├── themes/           # Темы оформления (default, light, neon)
│   ├── utils/            # Утилиты (screenMath.ts + тесты)
│   ├── App.tsx           # Роутинг
│   └── main.tsx          # Точка входа
├── api/
│   └── send.ts           # Serverless API (Vercel) для email/telegram
├── server/
│   └── index.js          # Express-сервер для отправки email
├── supabase/
│   └── migrations/       # SQL-миграции (leads + storage)
├── dist/                 # Продакшен-билд
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.cjs
├── vercel.json
└── .env.example
```

---

## 2. Функциональность

### 2.1 Реализованные страницы

| Путь | Страница | Статус |
|------|----------|--------|
| `/` | Главная | ✅ |
| `/led` | LED-экраны | ✅ |
| `/support` | Техсопровождение | ✅ |
| `/rent` | Аренда оборудования | ✅ |
| `/rent/:category` | Категория аренды | ✅ |
| `/cases` | Кейсы | ✅ |
| `/cases/:slug` | Детали кейса | ✅ |
| `/prices` | Цены/пакеты | ✅ |
| `/about` | О компании | ✅ |
| `/contacts` | Контакты | ✅ |
| `/consult` | Консультация | ✅ |
| `/calculator` | Калькулятор LED | ✅ |
| `/admin` | Админ-дашборд | ✅ |
| `/admin/content` | Индекс разделов админки | ✅ |
| `/admin/leads` | Заявки (Supabase) | ✅ |
| `/admin/cases` | Кейсы + загрузка изображений в Supabase Storage | ✅ |
| `/admin/packages` | Управление пакетами (RHF + Zod) | ✅ |
| `/admin/categories` | Управление категориями (RHF + Zod) | ✅ |
| `/admin/contacts` | Управление контактами (RHF + Zod) | ✅ |
| `/admin/calculator` | Управление конфигом калькулятора (RHF + Zod) | ✅ |

### 2.2 Ключевые фичи

1. **Калькулятор LED-экранов** (7 шагов):
   - Тип мероприятия → Локация → Зрители → Дистанция → Назначение → Площадка → Результат
   - Автоматический расчёт: размер экрана, шаг пикселя, мощность, установка
   - Учёт складских остатков
   - Лид-форма после расчёта

2. **Мульти-темизация**:
   - Default (тёмная)
   - Light (светлая)
   - Neon (неоновая)

3. **Админ-панель**:
   - Защищена Supabase Auth + ProtectedRoute
   - Разделена на независимые маршруты (packages/categories/contacts/cases/calculator/leads)
   - Формы в админке переведены на React Hook Form + Zod
   - Добавлен UX-слой: единый вывод ошибок полей + защита от потери несохраненных изменений

4. **Формы заявок**:
   - Запись лидов в Supabase
   - Отправка в Telegram и на email (serverless/Express)
   - Honeypot для базовой защиты от спама

5. **Хранилище медиа**:
   - Загрузка изображений кейсов в Supabase Storage bucket `images`

5. **SEO**:
   - Meta-теги (title, description, OG, Twitter Card)
   - Structured data (JSON-LD)
   - `robots.txt` и `sitemap.xml`
   - React Helmet Async

---

## 3. Проблемы и замечания

### 3.1 Критические (🔴)

| # | Проблема | Файл | Рекомендация |
|---|----------|------|--------------|
| 1 | **Публичный fallback ключ Supabase** | `src/lib/supabase.ts` | Убрать из клиента дефолтный URL/anon key, оставить только env |
| 2 | **Клиентский fallback отправки Telegram/email** | `src/lib/submitForm.ts`, `src/lib/telegram.ts` | Удалить клиентскую отправку, оставить только серверную |
| 3 | **Открытый CORS и отсутствие rate limiting** | `api/send.ts`, `server/index.js` | Ограничить origin и добавить лимиты запросов |
| 4 | **Логирование персональных данных** | `api/send.ts`, `server/index.js` | Удалить/сократить PII из логов |
| 5 | **Тесты не запускаются** | `vite.config.ts` | Добавить конфигурацию Vitest |

### 3.2 Средние (🟡)

| # | Проблема | Файл | Рекомендация |
|---|----------|------|--------------|
| 6 | **Анонимные вставки лидов в Supabase** | `supabase/migrations/...` | Перенести insert на сервер, добавить антиспам |
| 7 | **Предупреждения ESLint** | 5 warning'ов | Исправить unused variables |
| 8 | **Нет route-level предупреждения при уходе с dirty-формы** | admin pages | Добавить confirm при смене маршрута внутри SPA |
| 9 | **Не зафиксирован единый чек-лист env для Vercel** | документация | Добавить deploy checklist с обязательными env |

### 3.3 Низкие (🟢)

| # | Проблема | Файл | Рекомендация |
|---|----------|------|--------------|
| 10 | **Логи аналитики в продакшене** | `src/lib/analytics.ts` | Ограничить логирование в production |
| 11 | **Хардкод значений калькулятора** | `data/calculatorConfig.ts` | Вынести в управляемый источник |

---

## 4. Безопасность

### 4.1 Уязвимости

| Риск | Уровень | Описание |
|------|---------|----------|
| **Публичный anon key Supabase** | 🔴 Высокий | В коде есть дефолтные ключи, что упрощает доступ к проекту |
| **Клиентский Telegram токен** | 🔴 Высокий | Токен в frontend при fallback отправке |
| **CORS** | 🟡 Средний | `Access-Control-Allow-Origin: *` на `/api/send` |
| **Rate limiting** | 🟡 Средний | Нет защиты от спама/ботов на `/api/send` |
| **Логи с PII** | 🟡 Средний | Логи содержат email/телефон/имя |

### 4.2 Рекомендации по безопасности

1. **Ключи и токены**:
   - Убрать fallback ключи Supabase из клиента
   - Удалить клиентскую отправку Telegram/email

2. **CORS**:
   ```js
   // server/index.js
   app.use(cors({ origin: ['https://future-screen.ru'] }));
   ```

3. **Rate limiting**:
   ```js
   import rateLimit from 'express-rate-limit';
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 минут
     max: 10 // 10 запросов
   });
   app.use('/api/', limiter);
   ```

4. **Логирование**:
   - Удалить персональные данные из логов
   - Маскировать телефон/email в debug

---

## 5. Производительность

### 5.1 Размер бандла

Актуальные замеры не зафиксированы. Для обновлённого аудита нужен свежий `npm run build` и анализ `dist/assets/*`.

### 5.2 Рекомендации

1. **Code splitting**:
   ```tsx
   const RequestForm = lazy(() => import('./components/RequestForm'));
   ```

2. **Изображения**:
   - Проверить использование WebP/AVIF
   - Добавить `loading="lazy"` для изображений ниже fold'а

3. **Шрифты**:
   - Использовать `font-display: swap`
   - Предзагрузка критичных шрифтов

4. **Lighthouse цели**:
   - Performance: ≥90
   - SEO: ≥90
   - Accessibility: ≥90

---

## 6. SEO

### 6.1 Реализовано ✅

- Meta title/description на странице
- Open Graph теги
- Twitter Card
- Structured data (JSON-LD)
- `robots.txt` и `sitemap.xml`

### 6.2 Отсутствует ❌

- Canonical URL
- Hreflang (если нужна мультиязычность)

### 6.3 Рекомендации

1. **Canonical URL**:
   - Добавить canonical на ключевые страницы

2. **Hreflang**:
   - Добавить при появлении мультиязычности

---

## 7. Тестирование

### 7.1 Текущее состояние

- **Фреймворк:** Vitest 4.0.18
- **Тест-файлы:** 1 (`screenMath.test.ts`)
- **Статус:** ❌ Требует проверки/донастройки Vitest (в `vite.config.ts` нет секции `test`)

### 7.2 Проблема

```
 FAIL  src/utils/screenMath.test.ts
 Error: No test suite found in file
```

**Причина:** В `vite.config.ts` отсутствует конфигурация для тестов, а `tsconfig.json` исключает `*.test.ts`.

### 7.3 Решение

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

### 7.4 Рекомендации по тестам

1. **Добавить тесты для компонентов**:
   - Calculator
   - LeadForm
   - RequestForm

2. **E2E тесты**:
   - Playwright или Cypress
   - Критичные сценарии: форма, калькулятор, админка

3. **Покрытие**:
   - Цель: ≥70% для `src/utils/`, `src/lib/`

---

## 8. Деплой и CI/CD

### 8.1 Текущая конфигурация

- **Сборка:** `npm run build` → `dist/`
- **Сервер:** `npm run server` → Express на порту 3001
- **Dev:** `npm run dev:all` → concurrently (фронт + сервер)

### 8.2 Рекомендации

1. **Хостинг фронтенда (целевой)**:
   - Vercel (конфигурация `vercel.json` уже добавлена)
   - Проверить env-переменные проекта и production domain allowlist

2. **Хостинг сервера**:
   - VPS (Timeweb, Reg.ru, Selectel)
   - Docker контейнер

3. **CI/CD**:
   - GitHub Actions для автосборки
   - Preview деплой на PR

4. **Мониторинг**:
   - Sentry для ошибок
   - Uptime-мониторинг

---

## 9. Контент и данные

### 9.1 Структура данных

| Файл | Описание |
|------|----------|
| `data/calculatorConfig.ts` | Конфигурация калькулятора (pitch, цены, мощности) |
| `data/cases.ts` | Кейсы (3 штуки) |
| `data/categories.ts` | Категории аренды (5 штук) |
| `data/packages.ts` | Пакеты услуг |
| `data/contacts.ts` | Контакты |

### 9.2 Проблемы

1. **Мало кейсов** — всего 3
2. **Нужна контентная загрузка кейсов** (механизм загрузки фото реализован, но данных пока мало)
3. **Хардкод цен** в конфиге калькулятора

### 9.3 Рекомендации

1. **CMS или headless CMS**:
   - Strapi
   - Sanity
   - Contentful

2. **Изображения**:
   - Оптимизировать (WebP, сжатие)
   - Добавить в `public/` или S3

---

## 10. Сводная таблица проблем

| Приоритет | Категория | Проблема | Статус |
|-----------|-----------|----------|--------|
| 🔴 | Безопасность | Публичные fallback ключи Supabase | Требует исправления |
| 🔴 | Безопасность | Клиентский Telegram/email fallback | Требует исправления |
| 🔴 | Безопасность | Открытый CORS + нет rate limiting | Требует исправления |
| 🔴 | Тесты | Vitest требует настройки и проверки прогона | Требует исправления |
| 🟡 | Безопасность | Логи с PII | Желательно исправить |
| 🟡 | ESLint | 5 warning'ов | Желательно исправить |
| 🟡 | UX | Нет confirm при смене SPA-роута при dirty-форме | Желательно исправить |
| 🟢 | Контент | Мало кейсов | По желанию |

---

## 11. План работ

### Этап 1: Критические исправления (1-2 дня)

1. Удалить fallback ключи Supabase из клиента
2. Убрать клиентский Telegram/email fallback
3. Ограничить CORS и добавить rate limiting
4. Исправить конфиг Vitest и запустить тесты

### Этап 2: Безопасность и доставка (2-3 дня)

1. Сократить логирование PII
2. Перенести insert лидов на сервер
3. Добавить антиспам (captcha/slowdown)
4. Добавить deploy checklist для Vercel (env + Auth + Supabase policies)

### Этап 3: UX, SEO и производительность (2-3 дня)

1. Снять свежие метрики бандла
2. Оптимизировать бандл (code splitting)
3. Добавить route-level confirm при уходе с dirty-форм
4. Добавить canonical URL и проверить Lighthouse

### Этап 4: Контент и улучшения (по желанию)

1. Добавить кейсы с изображениями
2. Настроить CMS
3. Добавить E2E тесты
4. Настроить CI/CD

---

## 12. Выводы

### Сильные стороны ✅

1. Современный стек (React 18 + TS + Vite)
2. Модульная архитектура
3. Есть типизация TypeScript
4. Калькулятор — уникальная фича
5. Мульти-темизация
6. Формы админки переведены на RHF + Zod
7. Админка разделена на отдельные маршруты с Supabase-интеграцией

### Слабые стороны ❌

1. Тесты не запускаются
2. Риски безопасности вокруг ключей и CORS
3. Логи содержат PII
4. Нет route-level confirm при смене SPA-роута при dirty-форме
5. Недостаточно контента (кейсы и наполненность портфолио)

### Общая оценка

| Категория | Оценка |
|-----------|--------|
| Архитектура | ⭐⭐⭐⭐☆ (4/5) |
| Код | ⭐⭐⭐⭐☆ (4/5) |
| Безопасность | ⭐⭐☆☆☆ (2/5) |
| Производительность | ⭐⭐⭐☆☆ (3/5) |
| SEO | ⭐⭐⭐⭐☆ (4/5) |
| Тесты | ⭐⭐☆☆☆ (2/5) |
| Документация | ⭐⭐⭐☆☆ (3/5) |

**Итого:** Проект в рабочем состоянии для деплоя, но перед production рекомендуется закрыть блоки безопасности (fallback/PII/CORS/rate-limit), стабилизировать тесты и оформить deploy-checklist.

---

## Приложение A: Команды для запуска

```bash
# Установка зависимостей
npm install

# Разработка (фронтенд)
npm run dev

# Разработка (фронтенд + сервер)
npm run dev:all

# Сборка
npm run build

# Предпросмотр билда
npm run preview

# Линтинг
npm run lint

# Тесты (после настройки секции test в vite.config.ts)
npm run test

# Сервер (отдельно)
npm run server
```

---

## Приложение B: Переменные окружения

```env
# .env.example (актуально)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Для локальной разработки с отдельным backend (опционально)
VITE_API_URL=http://localhost:3001

# Serverless/API
VITE_TG_BOT_TOKEN=your_bot_token_here
VITE_TG_CHAT_ID=your_chat_id_here
SMTP_USER=your_email@list.ru
SMTP_PASS=your_password_or_app_password
SMTP_TO=recipient@example.com
SERVER_PORT=3001
```

---

**Аудит провёл:** Qwen Code  
**Дата:** 27 февраля 2026 г.
