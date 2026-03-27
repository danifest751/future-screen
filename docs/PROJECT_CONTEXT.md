# Project Context

## What
Future Screen — сайт для аренды LED-экранов с калькулятором подбора оборудования и админ-панелью.

## Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + CSS Modules
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **API**: Vercel Serverless Functions (Node.js)
- **State**: React Query + Context
- **Backgrounds**: WebGL/Three.js (ReactBits components)

## Key Directories
```
src/
  components/          # React components
    calculator/        # Калькулятор подбора экранов
    admin/             # Админ-панель
    backgrounds/       # WebGL фоны (Aurora, Mesh, Dots и т.д.)
  pages/               # Страницы приложения
  hooks/               # Кастомные хуки
  lib/                 # Утилиты, API клиенты
  data/                # Конфигурации, статичные данные
  context/             # React Context провайдеры
api/                   # Vercel API routes
server/                # Express сервер (для локальной dev)
supabase/migrations/   # SQL миграции
```

## Key Features
- **Калькулятор**: многошаговая форма расчёта LED-экрана
- **Админка**: управление категориями, кейсами, лидами, настройками
- **Фоны**: 8 анимированных WebGL фонов (ReactBits), синхронизируются через Supabase
- **Темы**: тёмная, светлая, neon

## Environment Variables
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase
- `VITE_EMAILJS_*` — EmailJS для форм
- `SUPABASE_SERVICE_ROLE_KEY` — серверный ключ

## Build Commands
```bash
npm run dev      # dev server
npm run build    # production build
npm run test     # vitest
```

## Notes
- Фоны lazy-loaded через `React.lazy()`
- Калькулятор использует конфиг из `src/data/calculatorConfig.ts`
- Админка защищена авторизацией Supabase Auth
