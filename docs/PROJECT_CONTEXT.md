# Project Context

## Что это
Future Screen — сайт для аренды LED-экранов с калькулятором подбора оборудования и админ-панелью.

## Стек
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + CSS Modules
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **API**: Vercel Serverless Functions (Node.js)
- **State**: React Query + Context
- **Backgrounds**: WebGL/Three.js (ReactBits компоненты)

---

## Структура проекта

```
src/
├── components/
│   ├── calculator/           # Калькулятор LED-экранов
│   │   ├── Calculator.tsx    # Главный компонент (шаги, состояние)
│   │   ├── steps/            # Шаги формы (StepAudience, StepDistance и т.д.)
│   │   ├── Result/           # Результаты расчёта (ResultCard, визуализации)
│   │   └── LeadForm/         # Форма захвата лида
│   ├── admin/                # Админ-панель
│   │   ├── AdminLayout.tsx   # Лейаут с sidebar
│   │   └── ui/               # UI компоненты админки (Button, Input, Modal)
│   ├── backgrounds/          # WebGL анимированные фоны
│   │   ├── ReactBitsLazy.tsx # Ленивая загрузка фонов
│   │   └── reactbits/        # 8 фонов: Aurora, Mesh, Dots, Waves, Rings, Nebula, Galaxy, ColorBends
│   ├── backgrounds/          # Каждый фон = JSX + CSS
│   │   └── reactbits/
│   │       ├── Mesh.jsx      # WebGL через Three.js
│   │       ├── Mesh.css      # Стили контейнера
│   │       └── ...
│   └── ...                   # Header, Footer, RequestForm и т.д.
├── pages/                    # Страницы (роутинг)
│   ├── CalculatorPage.tsx
│   ├── AdminDashboard.tsx
│   └── ...
├── hooks/                    # Кастомные хуки
│   ├── useCalculatorConfig.ts # Конфиг калькулятора из Supabase
│   ├── useSiteSettings.ts    # Настройки сайта (вкл/выкр разделы)
│   └── ...
├── lib/                      # Утилиты и API
│   ├── supabase.ts           # Клиент Supabase
│   ├── backgrounds.ts        # Логика фонов (синхронизация)
│   └── ...
├── data/                     # Статичные данные и конфиги
│   ├── calculatorConfig.ts   # Конфигурация расчётов
│   ├── categories.ts         # Категории услуг
│   └── ...
└── context/                  # React Context
    ├── AdminDataContext.tsx  # Данные для админки
    ├── AuthContext.tsx       # Авторизация
    └── ThemeContext.tsx      # Тема (dark/light/neon)
api/                          # Vercel Serverless Functions
├── send.ts                   # Отправка форм (EmailJS + Telegram)
└── client-log.ts             # Логирование клиентских ошибок
supabase/migrations/          # SQL миграции БД
```

---

## Где искать при задачах

### Калькулятор не работает / нужно изменить логику
- Логика шагов: `src/components/calculator/steps/`
- Конфигурация: `src/data/calculatorConfig.ts` или `src/hooks/useCalculatorConfig.ts`
- Результаты: `src/components/calculator/Result/ResultCard.tsx`
- Отправка лида: `src/lib/submitForm.ts` + `api/send.ts`

### Проблемы с фонами / добавить новый фон
- Компоненты фонов: `src/components/backgrounds/reactbits/`
- Логика переключения: `src/lib/backgrounds.ts`
- Ленивая загрузка: `src/components/backgrounds/ReactBitsLazy.tsx`
- **Важно**: каждый JSX импортирует одноимённый CSS файл
- Синхронизация между клиентами: через Supabase Realtime

### Админка / управление контентом
- Лейаут: `src/components/admin/AdminLayout.tsx`
- Страницы админки: `src/pages/Admin*Page.tsx`
- Данные: `src/context/AdminDataContext.tsx`
- API: `src/services/adminData.ts`

### Формы / отправка данных
- Валидация: `zod` (в submitForm.ts)
- Email: EmailJS (`VITE_EMAILJS_*` env vars)
- Telegram: бот для уведомлений
- Логи: `api/client-log.ts`

### Темы / стили
- Переменные CSS: `src/index.css` (:root)
- Темы: `data-theme="light"`, `data-theme="neon"`
- Переключатель: `src/components/ThemeSwitcher.tsx`

---

## Важные нюансы

### Фоны (ReactBits)
- 8 WebGL фонов на Three.js
- **Каждый фон требует CSS файл** с тем же именем
- Лениво загружаются (React.lazy)
- Синхронизируются через Supabase (глобальный фон для всех пользователей)
- Настройки фонов: яркость, скорость, цвета — в `src/lib/backgrounds.ts`

### Калькулятор
- Многошаговая форма (4 шага)
- Конфиг может загружаться из Supabase (useCalculatorConfig)
- Расчёты в `src/utils/screenMath.ts`
- Результат с визуализацией размеров экрана

### Админка
- Требует авторизации (Supabase Auth)
- Роли пользователей
- Редактирование категорий, кейсов, пакетов
- Управление фонами и настройками сайта

### Билд
- Vite собирает в `dist/`
- TypeScript строгий (no `any`)
- Pre-commit: `npm run build` должен проходить

---

## Environment Variables
```bash
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # только сервер

# EmailJS (отправка форм)
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=

# Telegram (уведомления)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## Команды
```bash
npm run dev      # vite dev server (port 5173)
npm run build    # production build
npm run test     # vitest
npm run preview  # preview production build
```

## Типичные проблемы
1. **"Could not resolve './Xxx.css'"** — создать CSS файл для компонента фона
2. **"@import must precede all other statements"** — переместить `@import` в начало index.css
3. **Фон не меняется** — проверить `src/lib/backgrounds.ts` и Supabase realtime подписку
4. **Ошибка авторизации в админке** — проверить env vars Supabase
