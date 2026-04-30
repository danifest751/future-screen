# Future Screen — Claude project guide

Сайт компании Future Screen (LED-экраны / звук / свет) с админкой,
inline-редактированием контента сайта и Supabase-бэкендом.

Этот файл — для AI-ассистентов (Claude Code и аналогов). Если читаете
вручную — здесь только то, что **отличает** проект от типового React-SPA;
бытовое (запуск, деплой) — в [README.md](README.md), правила коммитов —
в [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Стек

- **React 18 + TypeScript + Vite**, **TailwindCSS**, **React Router 6**
- **Supabase** (Postgres + Auth + Storage + RLS) — единый бэкенд
- **@tanstack/react-query** — кэш и мутации, см. [docs/REACT_QUERY_GUIDE.md](docs/REACT_QUERY_GUIDE.md)
- **react-hook-form + zod** — формы и валидация
- **react-hot-toast** — уведомления (через общие хуки, см. ниже)
- **lucide-react** — иконки
- **Vercel Functions** (`api/`) — отправка форм, telegram-webhook, share-reports
- **Playwright** — e2e, **Vitest + jsdom** — unit/component
- **Yandex.Metrika** — трекинг

---

## Команды

| Что | Команда |
|---|---|
| Dev (frontend) | `npm run dev` |
| Dev (frontend + serverless mock) | `npm run dev:all` |
| Type-check без билда | `npx tsc --noEmit` |
| Все unit-тесты | `npx vitest run` |
| Один файл тестов | `npx vitest run path/to/file.test.ts` |
| E2E (требует preview-сервер) | `npm run test:e2e` |
| Lint | `npm run lint` |
| Production-сборка | `npm run build` |
| Pre-push контракт | `npm run check:prepush` (lint + build + work:end) |

Husky + lint-staged автоматически прогоняют `eslint --fix` на staged-файлах в pre-commit. `--no-verify` использовать только если пользователь явно попросил.

---

## Структура

```
src/
├── App.tsx                 # роуты (lazy-импорты страниц)
├── main.tsx                # entry, провайдеры
├── pages/                  # публичные страницы
│   └── admin/              # админ-страницы (ProtectedRoute, requiredRole='admin')
├── components/
│   ├── admin/
│   │   ├── ui/             # ОБЩИЕ admin-примитивы (см. раздел ниже)
│   │   ├── media/          # MediaLibrary + MediaCard + DetailsModal + ...
│   │   ├── Editable{Image,List,Icon,Markdown}.tsx  # inline-редакторы
│   │   ├── EditToolbar.tsx # плавающая панель в edit-mode
│   │   └── AdminLayout.tsx # шапка/sidebar админки
│   └── visualLed/          # модуль LED-визуализатора (свой state/history)
├── context/
│   ├── AuthContext.tsx     # Supabase сессия
│   ├── EditModeContext.tsx # inline-edit mode + savesVersion + activeSaves
│   └── I18nContext.tsx     # siteLocale / adminLocale / adminContentLocale
├── hooks/                  # один хук = одна сущность ({useHomeHero, useLeads, ...})
├── services/               # тонкие обёртки над supabase (siteContent, mediaUsage, ...)
├── queries/                # React Query queryKeys + useXxxQuery / useXxxMutation
├── content/                # ВЕСЬ user-facing текст, RU+EN, по разделам
│   ├── pages/, components/, system/
├── lib/                    # утилиты без зависимостей от React
└── types/                  # доменные типы

api/                # Vercel serverless functions (TS)
server/             # legacy Express для локального dev (см. dev:all)
supabase/migrations # SQL миграции, ИМЕНОВАНИЕ: YYYYMMDD[HHMMSS]_*.sql
tests/e2e/          # Playwright (helpers/supabaseMock.ts)
docs/               # AI_RULES, PROJECT_CONTEXT, спеки фич
```

---

## Главные неписаные правила

### 1. Двухуровневая локализация

В UI работают **две независимые локали**:
- `siteLocale` — язык публичной части (по умолчанию `en`)
- `adminLocale` — язык интерфейса админки (по умолчанию `ru`)
- `adminContentLocale` — какую локаль контента админ сейчас редактирует (RU/EN, переключатель в `AdminLayout`)

Достаются через `useI18n()` (бросает вне провайдера) или `useOptionalI18n()` (RU-fallback, для shared-хуков и тестов).

**Любой user-facing текст идёт через `src/content/...`**, а не inline-литералом в JSX. Структура `content/` зеркалит `pages/` и `components/`. Каждый словарь экспортирует `{ ru, en }` + `getXxxContent(locale)`.

### 2. Inline-редактирование на сайте

На публичных страницах (HomePage, RentalHero и др.) **админ может редактировать текст/картинки/иконки/буллеты прямо на странице** через шестерёнку `AdminGearButton` → toggle edit-mode.

Есть 5 редакторов:
- **`useEditableBinding`** — текст и multiline (contentEditable), commit на blur/Enter
- **`EditableImage`** — клик открывает `MediaLibrary` picker
- **`EditableList`** — click-to-edit textarea «по элементу на строке»
- **`EditableIcon`** — клик открывает grid из `HOME_ICON_KEYS`
- **`EditableMarkdown`** — modal со split-view source/preview

**Все 5 используют общий хук `useEditableSave({ label })`** — единый источник для:
- `reportSaveStart/End/Succeeded` (через `EditModeContext`, чтобы работал `beforeunload` guard и `savesVersion` для refetch);
- localized toast `«{label} — сохранено · LOCALE»` (используя `siteLocale.toUpperCase()`).

Если делаете новый Editable\* — обязательно через `useEditableSave`, а не вручную.

**Обязательное правило**: каждому Editable\* передавать осмысленный уникальный `label`. Toast-id = `editable:${label}`, поэтому label типа `'Hero — title'` коллидит между HomePage и RentalHero. Используйте префиксы: `Home hero — title`, `Rental hero — title`.

### 3. Контент сайта живёт в Supabase, аудит — отдельной таблицей

`public.site_content` — key/value контент с RU+EN полями (`title/title_en`, `content/content_en`, и т.д.). Больши́е секции (`home_hero`, `home_works`, ...) хранят JSON в `content`.

`public.site_content_versions` — append-only audit log, пишется триггером `log_site_content_version()` (SECURITY DEFINER), читать может только admin (RLS). Вся история и rollback в [AdminContentHistoryPage](src/pages/admin/AdminContentHistoryPage.tsx) с JSON-diff по путям ([src/lib/jsonDiff.ts](src/lib/jsonDiff.ts)).

`saveSiteContent` и `loadSiteContent` (`src/services/siteContent.ts`) **обязательно требуют `locale` явно** — нет дефолта. Это сознательно, чтобы не было silent-saves в чужую локаль.

### 4. RBAC через JWT app_metadata

Роль читается из `auth.jwt() -> 'app_metadata' ->> 'role'` (см. `public.current_user_role()` в `supabase/migrations/20260419170000_*`). Роли: `admin` | `editor` | `viewer`. **`user_metadata` игнорируется** — её клиент может править через `updateUser`. Все RLS-политики используют `current_user_role() = 'admin'`.

Хук `useUserRole()` зеркалит ту же логику на клиенте. `ProtectedRoute requiredRole="admin"` — guard на роутах админки.

### 5. Общие admin/ui примитивы

Перед тем как писать админ-страницу, проверь [src/components/admin/ui/](src/components/admin/ui/):

| Компонент | Когда |
|---|---|
| `Button` / `Input` / `Select` / `Textarea` / `Field` | Базовые формы |
| `ConfirmModal` | Подтверждение действия |
| `EmptyState` / `LoadingState` | Пустой список / загрузка (НЕ свой spinner!) |
| `FallbackDot` | Маркер «EN-fallback на RU» рядом с заголовком |
| `MetricCard` | Карточка статистики (label/value/hint/Icon) |
| `FilterPills` | Tab-чипы (single/multi-select) — используй `pills`, не верстай вручную |
| `AdminPageToolbar` | Шапка list-страницы (filters/actions/secondary/hint) |
| `AdminEditPanelHeader` | Header sticky-формы редактирования (title + sourceLabel + edit-mode/isDirty pills + cancel) |

Хуки для типовых сценариев:

| Хук | Когда |
|---|---|
| `useEditableBinding` | Inline-редактирование текста на публичной странице |
| `useEditableSave` | Lifecycle + toast при сохранении (используется внутри Editable\*) |
| `useAdminCrudHandlers` | onSubmit/cancelEdit/handleDelete/handleResetDefaults для list+form страниц (Categories/Packages) |
| `useFormDraftPersistence` | Localstorage-черновик react-hook-form |
| `useUnsavedChangesGuard` | beforeunload при isDirty |

### 6. Тесты

- **Unit/component**: vitest + jsdom. `@testing-library/jest-dom` подключён через [vitest.setup.ts](vitest.setup.ts), так что DOM matchers (`toBeInTheDocument`, `toHaveAttribute` и т.д.) доступны в тестах.
- **React-hooks**: `renderHook` + `act` из `@testing-library/react`, мокайте `react-hot-toast`, `EditModeContext`, `I18nContext` — см. [useEditableSave.test.tsx](src/hooks/useEditableSave.test.tsx).
- **Supabase сервисы**: chain-mocker через Proxy; см. [siteContentVersions.test.ts](src/services/siteContentVersions.test.ts) или [mediaUsage.test.ts](src/services/mediaUsage.test.ts).
- **E2E**: моки Supabase в [tests/e2e/helpers/supabaseMock.ts](tests/e2e/helpers/supabaseMock.ts). Если добавляете новый запрос на site_content / RPC — добавьте handler.
- **Coverage thresholds**: lines/statements/functions ≥70, branches ≥60. Покрываемые модули перечислены в [vitest.config.ts](vitest.config.ts) (`coverage.include`).

### 7. Supabase

- Схема меняется **только миграциями** (`supabase/migrations/YYYYMMDD[_HHMMSS]_*.sql`).
- При изменении формы данных — синхронно обновляй типы (`src/lib/database.types.ts`, генерится через `npm run gen:types`) и мапперы (`src/lib/mappers.ts`).
- Все таблицы с RLS. Чтение публичного контента — `using (true)`, запись — admin-only через `current_user_role() = 'admin'` или явные insert/update policies.
- `auth.users` напрямую недоступна с клиента — для lookup используй RPC `editor_profiles(uuid[])` ([20260426_editor_profiles_lookup.sql](supabase/migrations/20260426_editor_profiles_lookup.sql)).

### 8. Стилевые конвенции

- **Внешние карточки** — `rounded-xl border border-white/10 bg-slate-800 p-4`
- **Вложенные блоки внутри карточки** — `bg-slate-900/30..50 p-3..4`
- **Бренд-акцент** — `brand-500/400/300` (определён в `tailwind.config.cjs`)
- **z-index**: модалки `z-50`, picker внутри Editable\* `z-[10001]`, EditToolbar `z-[10000]`, MediaDetailsModal `z-[10003]`
- Тёмная тема — единственная в админке. Светлая/неон — только для публичного сайта (`src/themes/`).

---

## Что НЕ делать

- ❌ Не пиши `toast.success/error` в новой странице — оборачивай через `useAdminCrudHandlers` или `useEditableSave`, чтобы поведение было однотипным.
- ❌ Не делай новый spinner — используй `LoadingState` из `admin/ui`.
- ❌ Не вызывай `saveSiteContent(key, input)` без `locale` — TS не позволит, но не пытайся обходить через cast.
- ❌ Не добавляй inline-литералы на русском/английском в новый JSX — заведи запись в `src/content/...`.
- ❌ Не правь SQL-миграции, которые уже есть на проде — добавляй новую.
- ❌ Не используй `user_metadata` для проверки роли. Только `app_metadata.role` через `useUserRole()` или `current_user_role()`.
- ❌ Не вызывай `vercel --prod` или `git push --force` без явной просьбы.

---

## Документы для чтения

- [README.md](README.md) — что это, как запустить, страницы, env
- [CONTRIBUTING.md](CONTRIBUTING.md) — формат коммитов (English, conventional)
- [AGENTS.md](AGENTS.md) — mempalace-routine для агентских сессий (если используется)
- [docs/REACT_QUERY_GUIDE.md](docs/REACT_QUERY_GUIDE.md) — паттерны React Query в проекте
- [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) — общий контекст
- [docs/AI_RULES.md](docs/AI_RULES.md) — другие правила для AI
- [docs/visual-led-functional-overview.md](docs/visual-led-functional-overview.md) — модуль визуализатора (отдельный мир, не пересекается с inline-edit)
- [supabase/README.md](supabase/README.md) — миграции и dev-окружение
- [docs/admin-remaining-work-plan.md](docs/admin-remaining-work-plan.md) — план работ по админке (актуальный backlog)
