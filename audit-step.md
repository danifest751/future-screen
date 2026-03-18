# Пошаговый аудит проекта Future Screen

**Дата:** 2026-03-18  
**Аудитор:** Kilo Code  
**Метод:** Статический анализ + проверка инструментами

---

## Шаг 1: Изучение структуры проекта

✅ **Выполнено**

Проанализирована файловая структура:
- 89 TypeScript/TSX файлов
- ~8 929 строк кода
- Основные директории: `src/components/`, `src/hooks/`, `src/lib/`, `src/pages/`, `src/context/`, `src/data/`, `src/utils/`, `src/themes/`, `src/types/`

---

## Шаг 2: Анализ конфигурационных файлов

✅ **Выполнено**

### Прочитанные файлы:
- [`package.json`](package.json) — зависимости, скрипты
- [`tsconfig.json`](tsconfig.json) — компилятор TypeScript
- [`vite.config.ts`](vite.config.ts) — сборка Vite
- [`vitest.config.ts`](vitest.config.ts) — тестирование
- [`.eslintrc.cjs`](.eslintrc.cjs) — линтинг

### Настройки:
- `strict: true` ✅
- `module: ESNext`, `target: ESNext`
- `jsx: react-jsx`
- Path alias `@/*` → `./src/*`
- Vitest: `globals: true`, `environment: jsdom`, `include: ['src/**/*.test.ts']`

---

## Шаг 3: Исходный код ключевых модулей

✅ **Выполнено**

### Прочитанные файлы:
- [`src/App.tsx`](src/App.tsx) — роутинг, lazy loading
- [`src/main.tsx`](src/main.tsx) — корневой рендер
- [`src/lib/supabase.ts`](src/lib/supabase.ts) — клиент Supabase
- [`src/lib/submitForm.ts`](src/lib/submitForm.ts) — отправка форм
- [`src/lib/analytics.ts`](src/lib/analytics.ts) — Яндекс.Метрика
- [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx) — аутентификация
- [`src/context/ThemeContext.tsx`](src/context/ThemeContext.tsx) — темы
- [`src/lib/clientErrorLogger.ts`](src/lib/clientErrorLogger.ts) — логирование ошибок
- [`src/lib/email.ts`](src/lib/email.ts) — отправка email
- [`src/lib/telegram.ts`](src/lib/telegram.ts) — отправка в Telegram
- [`server/index.js`](server/index.js) — локальный сервер
- [`api/send.ts`](api/send.ts) — Vercel Serverless Function
- [`src/hooks/useLeads.ts`](src/hooks/useLeads.ts) — работа с лидами
- [`src/hooks/useCategories.ts`](src/hooks/useCategories.ts) — категории
- [`src/hooks/useCases.ts`](src/hooks/useCases.ts) — кейсы
- [`src/hooks/usePackages.ts`](src/hooks/usePackages.ts) — пакеты
- [`src/hooks/useContacts.ts`](src/hooks/useContacts.ts) — контакты
- [`src/hooks/useCalculatorConfig.ts`](src/hooks/useCalculatorConfig.ts) — конфиг калькулятора
- [`src/utils/screenMath.ts`](src/utils/screenMath.ts) — математика LED-расчётов
- [`src/data/calculatorConfig.ts`](src/data/calculatorConfig.ts) — конфигурация калькулятора
- [`src/components/RequestForm.tsx`](src/components/RequestForm.tsx) — форма заявки
- [`src/components/ProtectedRoute.tsx`](src/components/ProtectedRoute.tsx) — защита роутов
- [`src/components/LoginModal.tsx`](src/components/LoginModal.tsx) — модалка входа
- [`src/utils/slugify.ts`](src/utils/slugify.ts) — slugification
- [`src/utils/normalizeList.ts`](src/utils/normalizeList.ts) — нормализация списков
- [`src/types/leads.ts`](src/types/leads.ts) — типы лидов
- [`src/lib/supabaseTest.ts`](src/lib/supabaseTest.ts) — тесты подключения Supabase
- [`src/hooks/useUnsavedChangesGuard.ts`](src/hooks/useUnsavedChangesGuard.ts) — защита от потери изменений

---

## Шаг 4: Проверка тестов и покрытия

⚠️ **Выполнено, обнаружены критические проблемы**

### Запуск тестов:
```bash
npx vitest run
```
**Результат:** FAIL — `No test suite found in file src/utils/screenMath.test.ts`

### Статистика:
- Тестовых файлов: **1** (`src/utils/screenMath.test.ts`)
- Тестов: **0** (не распознаются Vitest v4)
- Покрытие: **~0%** (требуется 85% для `lib/`)

### Проблемы:
1. **Vitest v4 несовместим** с текущим форматом тестового файла
2. **Нет тестов** для `lib/`, `hooks/`, `utils/`, `components/`, `pages/`
3. **Нет интеграционных тестов**

---

## Шаг 5: Проверка безопасности и зависимостей

✅ **Выполнено**

### npm audit:
```
19 vulnerabilities (1 low, 4 moderate, 14 high)
```

**Критические уязвимости:**
- `undici` (10 high) — DoS, HTTP smuggling, CRLF injection
- `minimatch` (6 high) — ReDoS
- `path-to-regexp` (1 high) — backtracking ReDoS
- `flatted` (1 high) — unbounded recursion DoS
- `rollup` (1 high) — arbitrary file write
- `tar` (2 high) — path traversal
- `qs` (1 high) — arrayLimit bypass DoS

**Многие уязвимости — транзитивные зависимости от `@vercel/node`, `eslint`, `vite`.**

### Проблемы безопасности кода:

| # | Проблема | Файл |
|---|----------|------|
| S1 | **Токен Telegram-бота в клиентском коде** — `VITE_TG_BOT_TOKEN` доступен в браузере | [`src/lib/telegram.ts:1`](src/lib/telegram.ts:1) |
| S2 | **Тестовые страницы без авторизации** — `/test-supabase`, `/check-supabase` | [`src/App.tsx:124-130`](src/App.tsx:124) |
| S3 | **Rate limiting in-memory** — не работает на multi-instance | [`server/index.js:21`](server/index.js:21) |
| S4 | **`escapeHtml` не экранирует кавычки** — возможен XSS в атрибутах | [`server/index.js:94-97`](server/index.js:94) |
| S5 | **CORS callback с `Error` без статуса** | [`server/index.js:41`](server/index.js:41) |

---

## Шаг 6: Архитектура и качество кода

✅ **Выполнено**

### Положительные стороны:
- ✅ Чёткое разделение concerns
- ✅ Lazy loading страниц
- ✅ `react-helmet-async` для SEO
- ✅ Типизированные контексты
- ✅ Zod-валидация форм
- ✅ Honeypot-защита
- ✅ Rate limiting, CORS
- ✅ Client error logger
- ✅ `ProtectedRoute` для админки
- ✅ ESLint проходит без ошибок

### Проблемы архитектуры:

| # | Проблема | Серьёзность | Файл(ы) |
|---|----------|-------------|---------|
| A1 | **Дублирование бэкенда** — `server/index.js` и `api/send.ts` идентичны | 🔴 Высокая | `server/index.js`, `api/send.ts` |
| A2 | **Нет shared DTO** — типы не общие между клиентом и сервером | 🟡 Средняя | `src/lib/submitForm.ts`, `api/send.ts` |
| A3 | **`server/index.js` на plain JS** — нет типов | 🟡 Средняя | `server/index.js` |
| A4 | **Тестовые страницы в продакшн-роутах** | 🔴 Высокая | `src/App.tsx:124-130` |
| A5 | **Устаревшие env-переменные в `.env.example`** | 🟡 Средняя | `.env.example` |
| A6 | **Монолитные админ-страницы** (>20K символов) | 🟡 Средняя | `src/pages/admin/` |
| A7 | **`UNSAFE_NavigationContext`** | 🟡 Средняя | `src/hooks/useUnsavedChangesGuard.ts:2` |

---

## Шаг 7: TypeScript компиляция

⚠️ **Выполнено, обнаружены ошибки**

```bash
npx tsc --noEmit
```

**Ошибки:**

1. `src/components/admin/AdminLayout.tsx(4,25)` — Cannot find module 'react-hot-toast'
2. `src/context/AuthContext.tsx(29,69)` — Parameter '_event' implicitly has an 'any' type
3. `src/context/AuthContext.tsx(29,77)` — Parameter 'session' implicitly has an 'any' type
4. `src/hooks/useLeads.ts(59,36)` — Parameter 'row' implicitly has an 'any' type
5. `src/lib/supabase.ts(1,30)` — Cannot find module '@supabase/supabase-js'
6. `src/pages/admin/*.tsx` (7 файлов) — Cannot find module 'react-hot-toast'

**Причины:**
- Отсутствуют типы для `react-hot-toast` (нет `@types/react-hot-toast`)
- Проблемы с типами Supabase (возможно, не установлены или версия несовместима)
- Неявные `any` в колбэках Supabase

---

## Шаг 8: Статистика и метрики

### Код:
- TypeScript/TSX файлов: **89**
- Строк кода (TS/TSX): **~8 929**
- Тестовых файлов: **1**
- Строк тестов: **~174**

### Зависимости:
- Production: **14**
- Development: **16**

### Уязвимости:
- Всего: **19** (1 low, 4 moderate, 14 high)

---

## Шаг 9: Формирование отчёта

✅ **Выполнено**

Создан подробный отчёт в файле [`AUDIT.md`](AUDIT.md) с:
- Общей статистикой
- Анализом архитектуры
- Проблемами TypeScript
- Состоянием тестирования
- Безопасностью
- Производительностью
- Качеством кода
- Приоритетным планом исправлений (16 пунктов)
- Decision Log

---

## Шаг 10: Дополнительно — .gitignore

✅ **Выполнено**

Добавлен `AUDIT.md` в [`.gitignore`](.gitignore:12), чтобы отчёт аудита не попадал в Git.

---

## Итоги

### Критические проблемы (требуют немедленного внимания):

1. 🔴 **Telegram токен в клиенте** — утечка секрета
2. 🔴 **Тестовые страницы открыты** — раскрытие структуры БД
3. 🔴 **Тесты не работают** — 0% покрытия при требовании 85%
4. 🔴 **TypeScript не компилируется** — 12 ошибок
5. 🔴 **19 уязвимостей зависимостей** — высокий риск

### Высокие приоритеты:

6. Дублирование бэкенда (server/index.js vs api/send.ts)
7. Отсутствие shared DTO
8. Монолитные админ-страницы
9. Нет CI/CD пайплайна

---

**Рекомендация:** Начать с исправления критических проблем (S1, S2, Te1, T1–T3) в течение 1–2 дней, затем перейти к архитектурным улучшениям (A1, A2) и настройке тестового покрытия.
