# Аудит проекта Future Screen

**Дата аудита:** 19 февраля 2026 г.  
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
├── server/
│   └── index.js          # Express-сервер для отправки email/telegram
├── dist/                 # Продакшен-билд
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.cjs
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
| `/admin/content` | Админ-панель | ✅ |

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
   - Защищена паролем (sessionStorage)
   - Управление контентом

4. **Формы заявок**:
   - Отправка в Telegram
   - Отправка на email (SMTP Mail.ru)
   - Honeypot для защиты от спама

5. **SEO**:
   - Meta-теги (title, description, OG, Twitter Card)
   - React Helmet Async

---

## 3. Проблемы и замечания

### 3.1 Критические (🔴)

| # | Проблема | Файл | Рекомендация |
|---|----------|------|--------------|
| 1 | **Тесты не работают** | `screenMath.test.ts` | Vitest не находит тесты — проверить конфиг `vite.config.ts` (добавить `test: { ... }`) |
| 2 | **Аналитика не подключена** | `src/lib/analytics.ts` | Заглушка `console.info()` — нужна интеграция с Яндекс.Метрикой |
| 3 | **Хранение пароля на клиенте** | `AuthContext.tsx` | Пароль админки в `import.meta.env` — уязвимость. Перенести аутентификацию на сервер |
| 4 | **Нет HTTPS для SMTP** | `server/index.js` | Порт 465 с `secure: true` — ок, но проверить сертификаты |

### 3.2 Средние (🟡)

| # | Проблема | Файл | Рекомендация |
|---|----------|------|--------------|
| 5 | **Предупреждения ESLint** | 5 warning'ов | Исправить unused variables |
| 6 | **Нет README** | Корень | Добавить документацию по запуску, деплою |
| 7 | **Жёстко закодированные пути** | `server/index.js` | SMTP хост, порты — вынести в `.env` |
| 8 | **Нет обработки ошибок форм** | `LeadForm.tsx` | Нет показа ошибок пользователю при failed submit |
| 9 | **Large bundle** | `RequestForm-CK2rErkd.js` | 81.78 kB (22.82 kB gzip) — code splitting, lazy loading |

### 3.3 Низкие (🟢)

| # | Проблема | Файл | Рекомендация |
|---|----------|------|--------------|
| 10 | **Нет прелоадера для роутов** | `App.tsx` | Есть `<Suspense>`, но можно улучшить |
| 11 | **Нет sitemap.xml / robots.txt** | `public/` | Добавить для SEO |
| 12 | **Нет favicon.svg в репозитории** | `public/` | Проверить наличие |
| 13 | **Константы в коде** | `calculatorConfig.ts` | Цены, мощности — вынести в конфиг |

---

## 4. Безопасность

### 4.1 Уязвимости

| Риск | Уровень | Описание |
|------|---------|----------|
| **Клиентская аутентификация** | 🔴 Высокий | Пароль админки хранится в `.env`, доступном на клиенте |
| **CORS** | 🟡 Средний | `cors({ origin: true })` — разрешает все origin'ы |
| **Rate limiting** | 🟡 Средний | Нет защиты от brute-force на `/api/send` |
| **Input validation** | 🟢 Низкий | Zod валидация есть, но не везде |

### 4.2 Рекомендации по безопасности

1. **Аутентификация**:
   - Перенести проверку логина/пароля на сервер
   - Использовать JWT или сессионные токены
   - Добавить HTTPS для продакшена

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

4. **Environment variables**:
   - Добавить `.env.production`
   - Не коммитить `.env` в git (уже в `.gitignore` ✅)

---

## 5. Производительность

### 5.1 Размер бандла

```
dist/assets/index-C87YElb9.js       208.28 kB (68.20 kB gzip)
dist/assets/RequestForm-CK2rErkd.js  81.78 kB (22.82 kB gzip)
dist/assets/CalculatorPage-S9j7U8Ed.js 34.53 kB (9.56 kB gzip)
```

**Проблема:** `RequestForm` слишком большой (81 kB).  
**Причина:** Вероятно, включает Zod + React Hook Form + зависимости.  
**Решение:** Lazy load для форм, tree shaking.

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
- Семантическая вёрстка

### 6.2 Отсутствует ❌

- `sitemap.xml`
- `robots.txt`
- Structured data (JSON-LD)
- Canonical URL
- Hreflang (если нужна мультиязычность)

### 6.3 Рекомендации

1. **Добавить sitemap.xml**:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url><loc>https://future-screen.ru/</loc></url>
     <url><loc>https://future-screen.ru/led</loc></url>
     <!-- ... -->
   </urlset>
   ```

2. **Structured data** (Organization):
   ```json
   {
     "@context": "https://schema.org",
     "@type": "Organization",
     "name": "Future Screen",
     "url": "https://future-screen.ru",
     "telephone": "+79122466566",
     "address": {
       "@type": "PostalAddress",
       "streetAddress": "Большой Конный полуостров, 5а",
       "addressLocality": "Екатеринбург"
     }
   }
   ```

---

## 7. Тестирование

### 7.1 Текущее состояние

- **Фреймворк:** Vitest 4.0.18
- **Тест-файлы:** 1 (`screenMath.test.ts`)
- **Статус:** ❌ Тесты не запускаются

### 7.2 Проблема

```
 FAIL  src/utils/screenMath.test.ts
 Error: No test suite found in file
```

**Причина:** В `vite.config.ts` отсутствует конфигурация для тестов.

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

1. **Хостинг фронтенда**:
   - Cloudflare Pages
   - Netlify
   - Vercel

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
2. **Нет изображений** в кейсах (пути не указаны)
3. **Хардкод цен** в конфиге

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
| 🔴 | Тесты | Vitest не работает | Требует исправления |
| 🔴 | Безопасность | Клиентская аутентификация | Требует исправления |
| 🔴 | Аналитика | Не подключена Метрика | Требует исправления |
| 🟡 | ESLint | 5 warning'ов | Желательно исправить |
| 🟡 | SEO | Нет sitemap/robots | Желательно добавить |
| 🟡 | Производительность | Большой бандл форм | Желательно оптимизировать |
| 🟢 | Документация | Нет README | По желанию |
| 🟢 | Контент | Мало кейсов | По желанию |

---

## 11. План работ

### Этап 1: Критические исправления (1-2 дня)

1. Исправить конфиг Vitest
2. Запустить и пройти тесты
3. Интегрировать Яндекс.Метрику
4. Исправить предупреждения ESLint

### Этап 2: Безопасность (2-3 дня)

1. Перенести аутентификацию на сервер
2. Настроить CORS
3. Добавить rate limiting
4. Добавить HTTPS

### Этап 3: SEO и производительность (2-3 дня)

1. Добавить sitemap.xml, robots.txt
2. Оптимизировать бандл (code splitting)
3. Добавить structured data
4. Проверить Lighthouse

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
6. Формы с валидацией Zod
7. Тесты (хоть и не работают)

### Слабые стороны ❌

1. Тесты не запускаются
2. Аналитика не подключена
3. Уязвимая аутентификация
4. Нет документации (README)
5. Большой размер бандла
6. Мало контента (кейсы, изображения)

### Общая оценка

| Категория | Оценка |
|-----------|--------|
| Архитектура | ⭐⭐⭐⭐☆ (4/5) |
| Код | ⭐⭐⭐⭐☆ (4/5) |
| Безопасность | ⭐⭐☆☆☆ (2/5) |
| Производительность | ⭐⭐⭐☆☆ (3/5) |
| SEO | ⭐⭐⭐☆☆ (3/5) |
| Тесты | ⭐⭐☆☆☆ (2/5) |
| Документация | ⭐☆☆☆☆ (1/5) |

**Итого:** Проект в хорошем состоянии, но требует исправления критических уязвимостей и настройки тестов/аналитики перед продакшеном.

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

# Тесты (требует исправления vite.config.ts)
npm run test

# Сервер (отдельно)
npm run server
```

---

## Приложение B: Переменные окружения

```env
# .env.example
VITE_ADMIN_LOGIN=admin
VITE_ADMIN_PASSWORD=your_secure_password_here

VITE_TG_BOT_TOKEN=your_bot_token_here
VITE_TG_CHAT_ID=your_chat_id_here

VITE_API_URL=http://localhost:3001

SMTP_USER=your_email@list.ru
SMTP_PASS=your_password_or_app_password
SMTP_TO=recipient@example.com
SERVER_PORT=3001
```

---

**Аудит провёл:** Qwen Code  
**Дата:** 19 февраля 2026 г.
