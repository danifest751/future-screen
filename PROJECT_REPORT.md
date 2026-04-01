# 📊 Полный отчёт по проекту Future Screen

**Дата отчёта:** 1 апреля 2026 г.  
**Версия проекта:** 0.0.1  
**URL:** https://future-screen.vercel.app  
**Стек:** React 18 + TypeScript + Vite + Supabase + TailwindCSS

---

## 1. 🎯 Общее описание

**Future Screen** — сайт компании по аренде LED-экранов и техническому сопровождению мероприятий (концерты, корпоративы, конференции, свадьбы, выставки).

**Основные услуги:**
- Аренда LED-экранов (интерьерные и уличные)
- Звуковое оборудование
- Световое оборудование  
- Сценические конструкции
- Компьютеры, тачскрины
- Технический персонал

**Ключевые цифры:** 18+ лет опыта, 500+ мероприятий/год, 300+ единиц техники

---

## 2. 🏗️ Архитектура проекта

### 2.1 Структура каталогов

```
future-screen/
├── api/                    # Vercel Serverless Functions
│   ├── send.ts            # Отправка форм (Email + Telegram)
│   └── client-log.ts      # Логирование клиентских ошибок
├── server/                 # Express сервер (локальная разработка)
├── src/
│   ├── components/        # React компоненты
│   │   ├── admin/          # Админ-панель (ui/, AdminLayout)
│   │   ├── backgrounds/    # WebGL фоны (8 штук)
│   │   ├── effects/        # Эффекты (StarBorder, BlurText)
│   │   ├── icons/          # Иконки (PhoneIcon, WhatsAppIcon)
│   │   ├── rental/         # Компоненты разделов аренды
│   │   └── ...             # Layout, Header, Footer, RequestForm
│   ├── context/            # React Context
│   │   ├── AdminDataContext.tsx  # Данные для админки (427 строк)
│   │   ├── AuthContext.tsx        # Авторизация
│   │   ├── SiteSettingsContext.tsx
│   │   └── ThemeContext.tsx       # Темы (dark/light/neon)
│   ├── data/               # Статические данные
│   │   ├── cases.ts       # Кейсы
│   │   ├── categories.ts   # Категории
│   │   ├── contacts.ts    # Контакты
│   │   ├── packages.ts    # Пакеты услуг
│   │   └── rentCategoriesContent.ts
│   ├── hooks/              # Кастомные хуки
│   ├── lib/                # Утилиты
│   │   ├── analytics.ts    # Яндекс.Метрика
│   │   ├── backgrounds.ts  # Логика фонов
│   │   ├── database.types.ts  # Типы Supabase
│   │   ├── emailCore.ts   # Email логика
│   │   ├── supabase.ts    # Клиент Supabase
│   │   └── submitForm.ts  # Отправка форм
│   ├── pages/              # Страницы
│   │   ├── HomePage.tsx   # Главная страница (707 строк)
│   │   ├── LedPage.tsx    # LED-экраны
│   │   ├── RentPage.tsx   # Аренда
│   │   ├── RentalCategoryPage.tsx  # Категория аренды
│   │   ├── CasesPage.tsx  # Кейсы
│   │   ├── CaseDetailsPage.tsx
│   │   ├── PricesPage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── ContactsPage.tsx
│   │   ├── ConsultPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── SupabaseCheckPage.tsx
│   │   └── admin/         # Админ-панель (10 страниц)
│   └── services/           # Сервисы
│       └── adminData.ts    # CRUD операции для админки
├── sql/                    # SQL миграции Supabase
├── docs/                   # Документация
├── plans/                  # Планы разработки
└── coverage/               # Покрытие тестами
```

### 2.2 Технологический стек

| Компонент | Технология | Версия |
|-----------|------------|--------|
| Frontend | React + TypeScript | 18.x / 5.4.x |
| Сборщик | Vite | 5.1.x |
| Стили | TailwindCSS | 3.4.x |
| Роутинг | React Router | 6.22.x |
| Формы | React Hook Form + Zod | 7.51.x / 3.22.x |
| Backend | Supabase | 2.97.x |
| API | Vercel Functions | 5.6.x |
| Анимации | Three.js + OGL | 0.183.x / 1.0.x |
| Тесты | Vitest + Playwright | 4.1.x / 1.58.x |
| Иконки | Lucide React | 1.7.x |
| SEO | React Helmet Async | 1.3.x |

---

## 3. 📂 Роутинг (20 страниц)

### Публичные страницы

| Путь | Компонент | Описание |
|------|----------|----------|
| `/` | HomePage | Главная страница |
| `/led` | LedPage | LED-экраны |
| `/support` | SupportPage | Техсопровождение |
| `/rent` | RentPage | Аренда оборудования |
| `/rent/:slug` | RentalCategoryPage | Категория аренды |
| `/cases` | CasesPage | Кейсы |
| `/cases/:slug` | CaseDetailsPage | Детали кейса |
| `/prices` | PricesPage | Цены/пакеты |
| `/about` | AboutPage | О компании |
| `/contacts` | ContactsPage | Контакты |
| `/consult` | ConsultPage | Консультация |
| `*` | NotFoundPage | 404 |

### Админ-панель (требует авторизации)

| Путь | Компонент | Описание |
|------|----------|----------|
| `/admin` | AdminDashboard | Дашборд |
| `/admin/content` | AdminContentIndexPage | Настройки |
| `/admin/leads` | AdminLeadsPage | Заявки |
| `/admin/cases` | AdminCasesManagerPage | Управление кейсами |
| `/admin/packages` | AdminPackagesPage | Пакеты |
| `/admin/categories` | AdminCategoriesPage | Категории |
| `/admin/contacts` | AdminContactsPage | Контакты |
| `/admin/backgrounds` | AdminBackgroundsPage | Фоны |
| `/admin/rental-categories` | AdminRentalCategoriesPage | Категории аренды |
| `/admin/rental/:id` | AdminRentalCategoryEditPage | Редактирование категории |

---

## 4. 🗄️ База данных Supabase

### 4.1 Таблицы

| Таблица | Назначение |
|---------|------------|
| `packages` | Пакеты услуг (Лайт, Медиум, Макси) |
| `categories` | Категории услуг (LED, Звук, Свет, Сцена) |
| `contacts` | Контактная информация |
| `leads` | Заявки с форм |
| `cases` | Кейсы (портфолио) |
| `rental_categories` | Категории аренды (8 штук) |

### 4.2 SQL миграции

| Файл | Назначение |
|------|------------|
| `001_create_rental_categories.sql` | Создание таблицы rental_categories |
| `002_seed_rental_categories.sql` | Наполнение 8 категорий контентом |
| `add_star_border_column.sql` | Добавление поля для StarBorder эффекта |

---

## 5. 🔐 Безопасность

### Реализованные меры ✅

| Мера | Расположение |
|------|-------------|
| CSP (Content Security Policy) | vercel.json |
| X-Content-Type-Options: nosniff | vercel.json |
| X-Frame-Options: DENY | vercel.json |
| Referrer-Policy | vercel.json |
| Rate Limiting (10 req/15 min) | api/send.ts |
| Rate Limiting (30 req/min) | api/client-log.ts |
| CORS с белым списком | api/send.ts, api/client-log.ts |
| Zod валидация | api/send.ts (emailPayloadSchema) |
| Honeypot для форм | RequestForm.tsx |
| ProtectedRoute | src/components/ProtectedRoute.tsx |

### ⚠️ Потенциальные проблемы

| Проблема | Риск | Рекомендация |
|----------|------|---------------|
| Пароль админки в sessionStorage | Средний | Перейти на JWT с httpOnly cookies |
| Отсутствие HSTS | Низкий | Добавить Strict-Transport-Security |
| Rate limiting in-memory | Средний | Использовать Redis KV |
| Не проверены RLS политики Supabase | ❓ | Запустить `get_advisors` |

---

## 6. 🔌 API Endpoints

### 6.1 `/api/send` (POST)

**Назначение:** Отправка заявок с форм

**Функционал:**
- ✅ Rate limiting (IP-based)
- ✅ Zod валидация (emailPayloadSchema)
- ✅ Отправка в Telegram (бот)
- ✅ Отправка admin email (SMTP Mail.ru)
- ✅ Отправка подтверждения клиенту
- ✅ Retry логика (3 попытки)
- ✅ Форматирование HTML email
- ✅ Логирование с requestId

**Payload:**
```typescript
{
  source: string
  name: string (required, 1-100 chars)
  phone: string (required, 5-20 chars)
  email?: string (email format)
  telegram?: string
  city?: string
  date?: string
  format?: string
  comment?: string (max 1000)
  extra?: Record<string, string>
}
```

### 6.2 `/api/client-log` (POST)

**Назначение:** Логирование клиентских ошибок

**Функционал:**
- ✅ Rate limiting (30 req/min)
- ✅ Zod валидация
- ✅ CORS с белым списком
- ✅ Санитизация payload

---

## 7. 📝 Админ-панель

### 7.1 Структура

- **AdminLayout** — лейаут с сайдбаром (358 строк)
- **Dashboard** — статистика и быстрые действия
- **10 специализированных страниц** управления контентом

### 7.2 Контекст данных (AdminDataContext)

**Размер:** 427 строк — СЛИШКОМ БОЛЬШОЙ

**Управляемые ресурсы:**
- `packages` — пакеты услуг
- `categories` — категории
- `contacts` — контакты
- `leads` — заявки
- `cases` — кейсы

**Методы для каждого ресурса:**
- `ensure*()` — загрузка данных
- `upsert*()` — создание/обновление
- `remove*()` — удаление
- `reset*()` — сброс к заводским

### 7.3 UI компоненты админки

| Компонент | Путь | Описание |
|-----------|------|----------|
| Button | admin/ui/Button.tsx | Кнопка с вариантами |
| Input | admin/ui/Input.tsx | Поле ввода |
| Select | admin/ui/Select.tsx | Выпадающий список |
| Textarea | admin/ui/Textarea.tsx | Текстовое поле |
| Field | admin/ui/Field.tsx | Обёртка поля с ошибкой |
| ConfirmModal | admin/ui/ConfirmModal.tsx | Модальное подтверждение |
| EmptyState | admin/ui/EmptyState.tsx | Пустое состояние |
| LoadingState | admin/ui/LoadingState.tsx | Состояние загрузки |

---

## 8. 🎨 UI/UX

### 8.1 Темы оформления

| Тема | Реализация |
|------|------------|
| Default (тёмная) | `data-theme="default"` |
| Light (светлая) | `data-theme="light"` |
| Neon (неоновая) | `data-theme="neon"` |

**Переключатель:** ThemeSwitcher.tsx в Header

### 8.2 WebGL фоны (8 штук)

| Фон | Компонент | CSS |
|-----|-----------|-----|
| Aurora | Aurora.jsx | Aurora.css |
| Mesh | Mesh.jsx | Mesh.css |
| Dots | Dots.jsx | Dots.css |
| Waves | Waves.jsx | Waves.css |
| Rings | Rings.jsx | Rings.css |
| Nebula | Nebula.jsx | Nebula.css |
| Galaxy | Galaxy.jsx | Galaxy.css |
| ColorBends | ColorBends.jsx | ColorBends.css |

**Особенности:**
- Ленивая загрузка через React.lazy
- Синхронизация через Supabase Realtime
- Настройки: яркость, скорость, цвета

### 8.3 Эффекты

| Эффект | Компонент | Описание |
|--------|-----------|----------|
| StarBorder | effects/StarBorder.tsx | Анимированная рамка |
| BlurText | effects/BlurText.tsx | Размытие текста при появлении |

---

## 9. 📱 Главная страница (HomePage.tsx)

**Размер:** 707 строк — СЛИШКОМ БОЛЬШАЯ

### Секции:

1. **Hero** — анимированные градиентные блобы, заголовок, CTA
2. **About** — о компании с feature-карточками
3. **Equipment** — оборудование в аренду (5 карточек + 3 дополнительных)
4. **Event Types** — направления мероприятий (6 карточек с градиентами)
5. **Process** — 4 шага работы (Заявка → Расчёт → Монтаж → Поддержка)
6. **CTA** — форма заявки с валидацией

---

## 10. 🧪 Тестирование

### Покрытие

| Область | Тесты | Статус |
|---------|-------|--------|
| screenMath | 26 unit тестов | ✅ |
| emailCore | unit тесты | ✅ |
| adminData мапперы | 212 строк тестов | ✅ |
| ConfirmModal | компонентные | ✅ |
| Остальной код | — | ❌ |

### Команды

```bash
npm run test          # Vitest unit тесты
npm run test:watch    # Watch mode
npm run test:e2e      # Playwright E2E
npm run test:e2e:ui   # Playwright UI
npm run test:all      # Все тесты
```

---

## 11. 📈 SEO и аналитика

### SEO

| Элемент | Статус |
|---------|--------|
| sitemap.xml | ✅ |
| robots.txt (блок /admin/) | ✅ |
| Structured Data (JSON-LD) | ✅ |
| Meta-теги (title, description) | ✅ |
| Open Graph теги | ✅ |

### Аналитика (Яндекс.Метрика)

**ID:** 85439743

**События:**
- `click_phone` — клик по телефону
- `click_whatsapp` — клик по WhatsApp
- `submit_form` — отправка формы
- `submit_quiz` — завершение квиза
- `submit_cta_form` — CTA форма на главной
- `view_case` — просмотр кейса
- `click_cta_hero` — клик по CTA на главной

---

## 12. 🔧 CI/CD и деплой

### Vercel конфигурация (vercel.json)

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/send", "destination": "/api/send.ts" },
    { "source": "/api/client-log", "destination": "/api/client-log.ts" },
    { "source": "/((?!api|assets).*)", "destination": "/index.html" }
  ]
}
```

### Headers безопасности

```json
{
  "Content-Security-Policy": "default-src 'self'...",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

### Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (сервер) |
| `VITE_ADMIN_LOGIN` | Логин админки |
| `VITE_ADMIN_PASSWORD` | Пароль админки |
| `TG_BOT_TOKEN` | Telegram bot token |
| `TG_CHAT_ID` | Telegram chat ID |
| `SMTP_USER` | Email для отправки |
| `SMTP_PASS` | Пароль SMTP |
| `SMTP_TO` | Email получателя |

---

## 13. ⚠️ Критические проблемы

### 🔴 КРИТИЧЕСКИЕ

| # | Проблема | Файл | Влияние |
|---|----------|------|---------|
| 1 | Fallback на статические данные скрывает ошибки | useContacts.ts | Пользователи видят устаревшие данные |
| 2 | Мёртвый код в AdminContentPage | AdminContentPage.tsx | Неиспользуемые импорты |
| 3 | Утечки useEffect зависимостей | useContacts.ts, SupabaseCheckPage.tsx | Непредсказуемое поведение |

### 🟡 ВАЖНЫЕ

| # | Проблема | Файл | Влияние |
|---|----------|------|---------|
| 1 | AdminDataContext слишком большой (427 строк) | AdminDataContext.tsx | Сложность поддержки |
| 2 | HomePage слишком большая (707 строк) | HomePage.tsx | Сложность поддержки |
| 3 | Дублирование server/ и api/ | server/, api/ | Путаница |
| 4 | Не проверены RLS политики Supabase | — | Потенциальная уязвимость |
| 5 | Нет Zod валидации в api/send.ts (ранее) | api/send.ts | ✅ УЖЕ ИСПРАВЛЕНО |

---

## 14. 📋 Рекомендации

### Немедленные (1-2 дня)

1. **Убрать fallback на статические данные** — заменить в хуках fallback на `[]` или `null`, показывать ошибку в UI
2. **Починить/удалить мёртвый код** — AdminContentPage.tsx
3. **Исправить утечки useEffect** — добавить все зависимости

### Ближайший спринт (1 неделя)

4. **Разделить AdminDataContext** — вынести логику в отдельные хуки
5. **Разделить HomePage** — вынести секции в отдельные компоненты
6. **Проверить RLS политики Supabase** — `get_advisors`
7. **Удалить или документировать server/** — если не используется для Vercel

### Долгосрочные (1 месяц)

8. **Добавить тесты** — покрыть хуки, страницы, API
9. **Оптимизировать фоны** — отключить WebGL на мобильных
10. **Добавить скелетоны загрузки** — улучшить UX
11. **Виртуализация списков** — для большого количества лидов

---

## 15. 📁 Планы и документация

| Файл | Назначение | Статус |
|------|------------|--------|
| README.md | Общая информация | ✅ Полный |
| PROJECT_CONTEXT.md | Контекст проекта | ✅ Детальный |
| AI_RULES.md | Правила для AI агентов | ✅ Полный |
| AUDIT.md | Аудит проекта | ✅ Детальный (576 строк) |
| SUPABASE_AUDIT.md | Аудит Supabase | ✅ Детальный |
| CONTRIBUTING.md | Участие в проекте | ✅ |
| RENTAL_SECTIONS_PLAN.md | План раздела аренды | ✅ Детальный |

### Планы разработки

| План | Описание |
|------|----------|
| RENTAL_SECTIONS_PLAN.md | Реализация 8 категорий аренды с CMS |

---

## 16. 📊 Сводная таблица оценок

| Область | Оценка | Статус |
|---------|--------|--------|
| Архитектура | 🟡 7/10 | Хорошо, требует доработки |
| Безопасность | 🟢 8/10 | Хорошо |
| Качество кода | 🟡 6/10 | Требует улучшений |
| Производительность | 🟢 8/10 | Хорошо |
| Тестирование | 🟡 5/10 | Недостаточно |
| Документация | 🟢 9/10 | Отлично |
| Supabase | 🟡 6/10 | Требует внимания |
| API | 🟢 8/10 | Хорошо |
| SEO/Аналитика | 🟢 9/10 | Отлично |
| UI/UX | 🟢 8/10 | Хорошо |

### Общий рейтинг: **🟡 7.5/10**

---

## 17. 📦 Зависимости (ключевые)

### dependencies
- react, react-dom (18.2.x)
- react-router-dom (6.22.x)
- @supabase/supabase-js (2.97.x)
- react-hook-form (7.51.x)
- @hookform/resolvers (3.3.x)
- zod (3.22.x)
- three (0.183.x)
- ogl (1.0.x)
- lucide-react (1.7.x)
- react-helmet-async (1.3.x)
- react-hot-toast (2.6.x)
- nodemailer (8.0.x)
- express (5.2.x)
- cors (2.8.x)
- markdown-to-jsx (7.4.x)
- clsx (2.1.x)
- postprocessing (6.39.x)

### devDependencies
- vite (5.1.x)
- typescript (5.4.x)
- tailwindcss (3.4.x)
- vitest (4.1.x)
- @vitest/coverage-v8 (4.1.x)
- @playwright/test (1.58.x)
- eslint (8.56.x)
- @vercel/node (5.6.x)
- concurrently (9.2.x)

---

*Отчёт составлен 1 апреля 2026 г. на основе анализа проекта Future Screen.*
