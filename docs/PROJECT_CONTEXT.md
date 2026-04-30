# Project Context

## Что это

Future Screen — React/Vite сайт компании по техническому сопровождению мероприятий: LED-экраны, звук, свет, сцены, аренда оборудования и кейсы. В проекте есть публичный сайт, админ-панель, inline-редактирование контента, Supabase-бэкенд и отдельный инструмент `/visual-led` для визуальной расстановки LED-экранов на изображениях площадок.

Этот документ нужен как быстрая карта проекта для разработчиков и AI-агентов. За строгими правилами работы см. `AGENTS.md`, `CLAUDE.md`, `docs/AI_RULES.md` и `CONTRIBUTING.md`.

## Стек

- Frontend: React 18, TypeScript, Vite, React Router 6.
- Styling: Tailwind CSS, глобальные CSS-переменные в `src/index.css`, публичные темы в `src/themes/`.
- State/data: React Context + `@tanstack/react-query`.
- Forms: `react-hook-form`, `zod`, `react-hot-toast`.
- Backend: Supabase (Postgres, Auth, Storage, RLS) + Vercel Functions в `api/`.
- Local server: `server/` Express-обвязка для `npm run dev:all`.
- Tests: Vitest/jsdom, Testing Library, Playwright e2e.
- UI assets: `lucide-react`, media library in Supabase Storage, static assets in `public/`.

## Главная структура

```text
src/
├── App.tsx                 # lazy routes, visual-led fullscreen bypass
├── main.tsx                # providers: Query, Helmet, Router, I18n, Theme, Auth, EditMode
├── components/
│   ├── admin/              # admin layout, inline editors, media library, admin/ui primitives
│   ├── rental/             # rental category public sections
│   └── visualLed/          # React visual LED editor: canvas, panels, state/history
├── content/                # all user-facing copy, RU+EN, split by pages/components/system
├── context/                # Auth, EditMode, I18n, Theme
├── data/                   # fallback/static cases, categories, packages, icons
├── hooks/                  # entity hooks and page-content hooks
├── i18n/                   # locale types/helpers
├── lib/                    # pure utilities, Supabase client, mappers, analytics, visualLed math
├── pages/                  # public pages
│   └── admin/              # protected admin pages
├── queries/                # React Query keys/hooks/mutations
├── services/               # thin Supabase service wrappers
└── types/                  # domain types

api/                        # Vercel Functions: forms, logs, reports, telegram, visual-led
server/                     # local Express/server helpers for dev:all
supabase/
├── migrations/             # canonical DB schema and data migrations
└── legacy/                 # historical SQL only; do not add new files
tests/e2e/                  # Playwright specs and Supabase mocks
docs/                       # project guides and feature specs
```

## Роуты

Публичные:

- `/` — главная.
- `/led` — LED-экраны.
- `/support` — техническое сопровождение.
- `/rent` и `/rent/:slug` — аренда и категории аренды.
- `/cases` и `/cases/:slug` — кейсы.
- `/prices` — пакеты/цены.
- `/about`, `/contacts`, `/consult`, `/privacy`.
- `/visual-led` — основной React-инструмент визуализации LED.
- `/visual-led/v2` — alias на React-инструмент.
- `/visual-led/legacy` — старый HTML-инструмент через iframe для fallback.

Админка, все через `ProtectedRoute requiredRole="admin"`:

- `/admin` — dashboard и навигация по секциям.
- `/admin/leads` — заявки.
- `/admin/cases`, `/admin/packages`, `/admin/categories`, `/admin/contacts`.
- `/admin/rental-categories`, `/admin/rental/:id`.
- `/admin/privacy-policy`.
- `/admin/content/home-equipment`, `/admin/content/history`.
- `/admin/visual-led-logs`, `/admin/visual-led-logs/:sessionId`.
- `/admin/visual-led/presets`, `/admin/visual-led/pitch-config`, `/admin/visual-led/storage`, `/admin/visual-led/pricing`.
- `/admin/content` больше не отдельный hub: редиректит на `/admin`.

## Локализация и контент

- Весь user-facing текст должен жить в `src/content/...`, а не inline в JSX.
- Контентные словари обычно экспортируют `{ ru, en }` и `getXxxContent(locale)`.
- Публичный сайт по умолчанию использует `en`, админ-интерфейс по умолчанию `ru`.
- `I18nContext` разделяет `siteLocale`, `adminLocale` и `adminContentLocale`.
- Админ может редактировать RU/EN контент отдельно; fallback-индикаторы показывают, когда EN берётся из RU.
- При добавлении текста обновляйте обе локали, либо делайте явный fallback там, где он нужен.

## Supabase и данные

Источник истины для схемы — `supabase/migrations/`. Новые изменения БД только новой миграцией, не правкой старой применённой миграции.

Ключевые области данных:

- `site_content` — JSON/key-value контент публичных секций и глобальных блоков.
- `site_content_versions` — append-only аудит изменений контента, rollback/history в админке.
- `leads` — заявки с tracking/delivery/read status.
- `cases`, `packages`, `contacts`, `rental_categories` — основные публичные сущности.
- `media_items`, `case_media_links`, Storage bucket `images` — медиа-библиотека.
- `visual_led_sessions`, `visual_led_events`, `visual_led_assets` — логирование visual-led.
- `visual_led_projects` — сохранённые проекты visual-led.
- `visual_led_presets`, `visual_led_pitch_config`, `visual_led_day_discounts` — admin-managed конфиг визуализатора.

RBAC:

- Роли: `admin`, `editor`, `viewer`.
- Источник роли: `auth.jwt() -> app_metadata -> role`.
- `user_metadata` не использовать для авторизации.
- RLS-политики завязаны на `public.current_user_role()` и admin-only записи.

После изменения схемы обновляйте типы и мапперы:

```bash
npm run gen:types
```

## Inline-редактирование сайта

Админ может включить edit-mode на публичных страницах через `AdminGearButton`.

Основные компоненты:

- `src/context/EditModeContext.tsx` — edit-mode, active saves, beforeunload guard integration.
- `src/hooks/useEditableBinding.ts` — text/multiline binding.
- `src/hooks/useEditableSave.ts` — единый lifecycle сохранения и toast.
- `src/components/admin/EditableImage.tsx`.
- `src/components/admin/EditableList.tsx`.
- `src/components/admin/EditableIcon.tsx`.
- `src/components/admin/EditableMarkdown.tsx`.
- `src/components/admin/EditToolbar.tsx`.

Важно:

- Каждый Editable должен получать уникальный осмысленный `label`, например `Home hero - title`, чтобы toast-id не коллидил.
- `saveSiteContent` и `loadSiteContent` требуют явный `locale`; не обходить это через casts.
- Новые публичные editable-секции должны иметь fallback в `src/content/...`, Supabase key и админский способ увидеть источник/fallback.

## Админка

Основной layout: `src/components/admin/AdminLayout.tsx`.

Перед созданием нового UI проверьте `src/components/admin/ui/`:

- `Button`, `Input`, `Select`, `Textarea`, `Field`.
- `ConfirmModal`.
- `EmptyState`, `LoadingState`.
- `FallbackDot`.
- `MetricCard`.
- `FilterPills`.
- `AdminPageToolbar`.
- `AdminEditPanelHeader`.

Полезные хуки:

- `useAdminCrudHandlers` — submit/cancel/delete/reset для CRUD-страниц.
- `useFormDraftPersistence` — черновики форм в localStorage.
- `useUnsavedChangesGuard` — guard при несохранённых изменениях.
- `useUserRole` — роль из Supabase JWT.

В новой админке не пишите собственные spinner/toast-паттерны без причины: берите общие примитивы и хуки.

## Visual LED

`/visual-led` — крупный самостоятельный модуль. Он не является старым LED-калькулятором.

Где искать:

- React UI: `src/pages/VisualLedV2Page.tsx`, `src/components/visualLed/`.
- State/history/persistence: `src/components/visualLed/state/`.
- Geometry/pricing/report math: `src/lib/visualLed/`.
- Server API: `api/visual-led/save.ts`, `api/visual-led/load.ts`, `api/visual-led/upload-background.ts`, `api/visual-led-logs/[action].ts`.
- Admin config: `src/pages/admin/AdminVisualLed*Page.tsx`, `src/services/visualLedConfig.ts`, `src/hooks/useVisualLedConfig.ts`.
- Legacy assets: `public/visual-led-legacy/`.
- Preset assets: `public/visual-led-presets/`.
- Functional overview: `docs/visual-led-functional-overview.md`.

Возможности:

- загрузка фона/плана площадки;
- масштабирование и калибровка;
- добавление экранов по перспективе и в floor-plan режиме;
- pixel pitch, кабинеты, разрешение, цена;
- несколько сцен;
- видео/демо-пресеты;
- сохранение/загрузка проектов;
- HTML-отчёты и share-links;
- логирование пользовательских событий для админки.

## API и интеграции

Vercel rewrites находятся в `vercel.json`.

Основные endpoints:

- `api/send.ts` — формы, запись lead, email, Telegram.
- `api/client-log.ts` — клиентские ошибки.
- `api/telegram-webhook.ts` — загрузки/команды через Telegram.
- `api/report-share.ts` и `/reports/:slug` — сохранённые отчёты visual-led.
- `api/visual-led/*` — сохранение проектов, загрузка, background upload.
- `api/visual-led-logs/[action].ts` — visual-led event/session APIs.

Server-side код использует `SUPABASE_SERVICE_ROLE_KEY`; не добавлять fallback на anon key для write/admin операций.

## Переменные окружения

Актуальный набор смотрите по коду, так как `.env.example` сейчас отсутствует. Часто используемые:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

VITE_API_URL=
VITE_ERROR_LOG_URL=
PUBLIC_SITE_URL=
ALLOWED_ORIGINS=

SMTP_USER=
SMTP_PASS=
SMTP_TO=

TG_BOT_TOKEN=
TG_CHAT_ID=
TELEGRAM_WEBHOOK_SECRET=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Yandex.Metrika id захардкожен в `src/lib/analytics.ts`.

## Команды

```bash
npm run dev                 # Vite dev server на порту 5000
npm run server              # локальный Express server
npm run dev:all             # server + Vite
npm run lint                # lint src/server/api
npm run build               # TS build + API TS check + Vite build
npm run test                # Vitest
npm run test:e2e            # Playwright
npm run test:e2e:update-snapshots
npm run check:prepush       # lint + build + work:end
npm run secrets:scan
```

Память проекта:

```bash
npm run memory:session
npm run memory:search -- "<query>"
npm run memory:session:save
npm run memory:status
```

## Тесты и качество

- Unit/component: Vitest + jsdom.
- E2E: Playwright, Supabase моки в `tests/e2e/helpers/supabaseMock.ts`.
- API tests: `tests/api/` и `api/*.test.ts`.
- Visual-led имеет много точечных тестов в `src/lib/visualLed/` и `src/components/visualLed/`.
- `@testing-library/jest-dom` подключён через `vitest.setup.ts`; DOM matchers доступны глобально в Vitest.
- Перед handoff/push по правилам проекта: `npm run check:prepush`.

## Где искать по типовым задачам

- Роутинг/страницы: `src/App.tsx`, `src/pages/`.
- Публичный текст: `src/content/pages/`, `src/content/components/`, `src/content/global.ts`.
- Глобальная шапка/подвал/формы: `src/hooks/useGlobal*`, `src/lib/content/*`, `src/content/global.ts`.
- Главная: `src/hooks/useHome*`, `src/lib/content/home*`, `src/content/pages/home.ts`.
- Аренда: `src/pages/RentPage.tsx`, `src/pages/RentalCategoryPage.tsx`, `src/components/rental/`, `src/services/rentalCategories.ts`.
- Кейсы и медиа: `src/pages/admin/AdminCasesRedesignedPage.tsx`, `src/components/admin/media/`, `src/services/mediaUsage.ts`.
- Лиды и уведомления: `api/send.ts`, `server/lib/sendApi/`, `src/pages/admin/AdminLeadsPage.tsx`.
- Telegram upload flow: `api/telegram-webhook.ts`, `server/lib/telegramWebhook/`.
- Content history/rollback: `src/pages/admin/AdminContentHistoryPage.tsx`, `src/services/siteContentVersions.ts`, `src/lib/jsonDiff.ts`.
- Supabase policies/types: `supabase/migrations/`, `src/lib/database.types.ts`, `src/lib/mappers.ts`.
- Visual-led: `src/components/visualLed/`, `src/lib/visualLed/`, `docs/visual-led-functional-overview.md`.

## Важные ограничения

- Не добавлять новые user-facing строки inline в active UI.
- Не смешивать локали: public default EN, admin UI default RU, admin content locale отдельная.
- Не править старые применённые миграции; добавлять новую.
- Не делать авторизацию через `user_metadata`.
- Не писать секреты в репозиторий; перед push проверить staged files и при необходимости `npm run secrets:scan`.
- Не использовать `vercel --prod`, force push или destructive git-команды без явной просьбы.
