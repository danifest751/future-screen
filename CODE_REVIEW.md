# Future Screen — Code Review (Post-Hardening)

**Previous review:** 2026-04-18, `75c9f6c` — punch list of 10 C / 16 H / 30 M / 18 P.
**This snapshot:** 2026-04-19, `cccd34c` — after PR #0..#8 merged (`security/hardening-2026-04` branch).

Между ревью прошли сутки, за которые закрыли все критические уязвимости и половину high. Этот файл — **current state**: что реально осталось, без уже закрытых пунктов.

---

## ✅ Resolved since 2026-04-18

Проверено чтением текущего кода (не по commit-месседжам):

**All 10 Critical:**
- C1 — [43f853d](../commit/43f853d) telegram-webhook GET actions теперь требуют bearer token; `TELEGRAM_WEBHOOK_SECRET` обязателен на POST.
- C2 — [554c391](../commit/554c391) + [8546431](../commit/8546431): RBAC ушёл в `app_metadata`, fallback на `user_metadata` удалён, миграции `sql/006`/`sql/008`, backfill-скрипт.
- C3 — [64822ad](../commit/64822ad): все 14 `/admin/*` маршрутов в [App.tsx:95-107](src/App.tsx#L95-L107) имеют `requiredRole="admin"` (раньше был только один).
- C4 — [9ef7211](../commit/9ef7211) + `sql/009`: `leads` RLS ограничены до trusted role, добавлен `deleted_at` для soft-delete.
- C5 — [091421a](../commit/091421a) + [fb2e564](../commit/fb2e564): `saveToLeads` убран с клиента; INSERT/UPDATE идёт server-side в `/api/send` через service-role.
- C6 + C7 — [f7ea466](../commit/f7ea466): id `site_settings` согласован, legacy `useSiteSettings.ts` удалён, context потребляет `useSiteSettingsQuery`.
- C8 — [3a1517e](../commit/3a1517e): `isomorphic-dompurify` при POST + `Content-Security-Policy: sandbox allow-same-origin` на `/reports/*` ([api/report-share.ts:109](api/report-share.ts#L109)).
- C9 + C10 — [0479358](../commit/0479358): `<meta>` CSP удалён из `index.html`, в `vercel.json` — строгий `connect-src`, `base-uri`, `form-action`, `object-src 'none'`, HSTS.

**High (10 of 16):**
- H2 ([242cf07](../commit/242cf07)) — PII больше не летит в Yandex.Metrika.
- H3 ([f17296e](../commit/f17296e)) — Upstash Redis вместо in-memory Map.
- H4 ([43f853d](../commit/43f853d)) — `api/send.ts`/`telegram-webhook.ts` throw'ят если `SUPABASE_SERVICE_ROLE_KEY` отсутствует.
- H6 ([7d7f72b](../commit/7d7f72b)) — `visual-led/save.ts` реально персистит в `visual_led_projects` (миграция `sql/010`).
- H8 — Origin header обязателен на state-changing methods.
- H9 — `sql/007`: anon читает `site_content` где `is_published=true`.
- H10 — `style` убран из DOMPurify allow-list.
- H11 — `<ErrorBoundary>` оборачивает `<App>` в [main.tsx](src/main.tsx).
- H12 — `console.error` monkey-patch удалён.
- H16 — husky + gitleaks в [022c81e](../commit/022c81e); verify-deploy CI smoke-test.

**Medium (2 of 30):** M12 (CSV formula-injection), M20 (rel noopener).
**Polish (5 of 18):** P1-P5 — выкинули `attached_assets/`, `design-archive/`, `coverage/`, `test-results/` из git.

---

## 🟠 High — что осталось

### H1. `useStarBorderGlobal` — MutationObserver на body без throttle

[src/hooks/useStarBorderGlobal.ts:72-89](src/hooks/useStarBorderGlobal.ts#L72-L89). Observer подписан на `document.body` с `subtree: true, childList: true`; callback на каждый childList-change вызывает `applyStarBorder` напрямую, без requestAnimationFrame/debounce. Внутри — 3 `document.querySelectorAll` обходящих всё дерево.

**Фикс:** обернуть callback в `requestAnimationFrame` с флагом «уже запланирован»; ограничить `observer.observe` до конкретного root.

### H5. `api/visual-led/analyze.ts` — DoS через 67 МБ payload

[api/visual-led/analyze.ts:5-9](api/visual-led/analyze.ts#L5-L9): `rgba: z.array(...).optional()` без length-constraint. `width * height * 4` до 4096×4096×4 = 67M int'ов. [L23-L26](api/visual-led/analyze.ts#L23-L26): CORS echo любой origin. Нет rate-limit (а в [save.ts](api/visual-led/save.ts) — есть).

**Фикс:** `z.array(...).max(width*height*4)` + pre-parse length-check; origin-allowlist; `checkRateLimit` из того же `_lib/rateLimit.js`; лучше — принимать `application/octet-stream` binary, не JSON-массив.

### H7. `shared_reports` без TTL / size-budget

[supabase/migrations/20260410_create_shared_reports.sql](supabase/migrations/20260410_create_shared_reports.sql) — нет `expires_at`, нет cron-cleanup. Таблица растёт бесконечно; даже с DOMPurify-санитайзом 4 МБ × N записей забьют storage. POST имеет rate-limit (через PR #7a — надо проверить), но нет жизненного цикла.

**Фикс:** `ALTER TABLE shared_reports ADD COLUMN expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'`; ночной pg_cron DELETE старше `expires_at`.

### H13. Direct-DOM writes внутри React-компонентов

[src/pages/HomePage.tsx:14-29](src/pages/HomePage.tsx#L14-L29) мутирует `el.style.opacity` в effect'е; [src/components/Header.tsx:59-63](src/components/Header.tsx#L59-L63) меняет `event.currentTarget.style.color` на mouseover. В связке с H1 образует цикл: React → DOM-mutation → MutationObserver → querySelectorAll → потенциальный ре-рендер.

**Фикс:** перенести на CSS-классы (`.is-visible`, `:hover`) или на framer-motion.

### H14. `visual_led_sessions/events/assets` — RLS включён, policies нет

[supabase/migrations/20260412170000_visual_led_logging.sql](supabase/migrations/20260412170000_visual_led_logging.sql) — `ENABLE ROW LEVEL SECURITY` без `CREATE POLICY`. Фактически работает только service-role (client админки ходит через API с bearer token — OK для текущего состояния). Риск — следующая миграция молча сломает доступ, surface ошибки нет.

**Фикс:** явная `CREATE POLICY "service_role_only" ... USING (false)` с комментарием-intent; или `"admin_read" FOR SELECT USING (auth.jwt()->>'app_metadata'->>'role' = 'admin')` если хочется прямой SELECT из дашборда.

### H15. Нет миграций для таблиц `cases`, `categories`, `packages`, `contacts`, `telegram_*`

Упоминаются в `src/queries/*.ts` и [api/telegram-webhook.ts:147-218](api/telegram-webhook.ts#L147-L218). Ни одной `CREATE TABLE` в `sql/` или `supabase/migrations/`. Реплицировать БД из свежего клона **невозможно**.

**Фикс:** `supabase db pull > supabase/migrations/20260419_baseline.sql` + коммит.

---

## 🟡 Medium — что осталось

### M1. Мутация module-level state во время render

[src/pages/admin/AdminLeadsPage.tsx:11-12, 305-306](src/pages/admin/AdminLeadsPage.tsx#L11-L12): `let adminLeadsContent = ...` переприсваивается в теле компонента. Ломает StrictMode / Suspense retries / concurrent-render.

### M2. `AuthContext` и `ThemeContext` — value не мемоизированы

[src/context/AuthContext.tsx:58](src/context/AuthContext.tsx#L58), [src/context/ThemeContext.tsx:31](src/context/ThemeContext.tsx#L31). Новый object literal на каждый render → все consumers re-render. `I18nContext` правильно мемоизирован — эти два нет.

### M3. `useFocusTrap` returnFocus срабатывает не по переходу

[src/hooks/useFocusTrap.ts:48-55](src/hooks/useFocusTrap.ts#L48-L55). Cleanup проверяет `if (!active)`, но cleanup и так запускается на deps-change/unmount. «Вернуть focus когда модалка закрылась» должно быть гейтом `prev === true && curr === false`.

### M4. `useLeadsQuery` грузит всю таблицу leads

[src/queries/leads.ts:15-28](src/queries/leads.ts#L15-L28) — `select('*')` без `range()`. Плюс [useLeads.ts:10](src/hooks/useLeads.ts#L10) — `.map(mapLeadFromDB)` без `useMemo` (новый массив на render).

### M5. `useMediaLibraryQuery` / `useMediaTagsQuery` без лимитов

[src/queries/mediaLibrary.ts:30-75](src/queries/mediaLibrary.ts#L30-L75) без limit. [L101-L121](src/queries/mediaLibrary.ts#L101-L121) — Set-dedupe тегов на клиенте требует тянуть весь `tags` со всех row.

### M6. `useMediaUpload.listBuckets()` на каждый файл

[src/hooks/useMediaUpload.ts:82-90](src/hooks/useMediaUpload.ts#L82-L90) — bucket-exists check в per-file-цикле, результат не кэшируется.

### M7. `postprocessing` — dead dep; three/ogl без chunk-split

[package.json:47](package.json#L47) `postprocessing` нигде не импортируется в `src/` (~300 КБ). [vite.config.ts:26-30](vite.config.ts#L26-L30) `manualChunks` не содержит `three`/`ogl`.

### M8. `reportCompressedSize: true`

[vite.config.ts:33](vite.config.ts#L33). Замедляет CI build.

### M9. `.gitignore: *.js` слишком широко

[.gitignore:7](.gitignore#L7). Риск скрыть будущие `server/*.js`.

### M10. Нет Permissions-Policy / COOP / CORP

[vercel.json](vercel.json) — HSTS уже добавлен (C10 fix). Осталось:
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`

### M11. Компоненты-монстры

| Файл | Строк |
|------|-------|
| [HomePage.tsx](src/pages/HomePage.tsx) | 834 |
| [AdminCasesRedesignedPage.tsx](src/pages/admin/AdminCasesRedesignedPage.tsx) | 738 |
| [AdminVisualLedLogsPage.tsx](src/pages/admin/AdminVisualLedLogsPage.tsx) | 611 |
| [AdminLeadsPage.tsx](src/pages/admin/AdminLeadsPage.tsx) | 579 |
| [AdminRentalCategoryEditPage.tsx](src/pages/admin/AdminRentalCategoryEditPage.tsx) | 577 |

### M13. Honeypot `display:none` — легко распознаваем

[src/components/RequestForm.tsx:95](src/components/RequestForm.tsx#L95). Современные спам-тулкиты пропускают `hidden`/`display:none`.

### M14. Третья форма `CtaForm` без honeypot

[src/pages/HomePage.tsx:418-549](src/pages/HomePage.tsx#L418-L549). Дублирует логику `RequestForm`, без honey-поля.

### M15. `consent` не валидируется server-side

[src/pages/HomePage.tsx:529](src/pages/HomePage.tsx#L529). Только client-side `disabled`. `/api/send` не проверяет.

### M16. Playwright — только Chromium desktop

[playwright.config.ts:15-20](playwright.config.ts#L15-L20). Нет Firefox/WebKit/mobile.

### M17. Нет vitest `setupFiles` — jest-dom matchers не загружены

[vitest.config.ts:4-11](vitest.config.ts#L4-L11). Tripwire на будущие тесты.

### M18. Тестов нет на критичный путь

Submit-form end-to-end, `useUserRole` (RBAC-граница), `AdminLeadsPage` filter/export, API-handler'ы (`/api/**.test.ts` — ноль).

### M19. Дубль `api/` ↔ `server/` для email/Telegram

[api/send.ts:328-398](api/send.ts#L328-L398) реимплементирует `formatTelegramMessage`/`sendEmail`, при этом импортит `processEmailSubmission` из `server/lib/emailCore.js`. Две параллельные имплементации.

### M21. Mobile menu — нет focus-trap, `aria-expanded`, Esc-close

[src/components/Header.tsx:217-232](src/components/Header.tsx#L217-L232).

### M22. Rental dropdown — hover-only, keyboard inaccessible

[src/components/Header.tsx:148-156](src/components/Header.tsx#L148-L156) — только `onMouseEnter`.

### M23. `LazyImage` + CLS

[src/components/LazyImage.tsx:40-45, 59-66](src/components/LazyImage.tsx#L40-L66). Админские `<img>` без `width`/`height` — layout-shift.

### M24. `ReactBitsLazy` форсит `any` на все backgrounds

[src/components/backgrounds/ReactBitsLazy.tsx:9-28](src/components/backgrounds/ReactBitsLazy.tsx#L9-L28). `.jsx` файлы не типизированы.

### M25. `useFocusTrap` deps неполные — не включает `containerRef.current`

[src/hooks/useFocusTrap.ts:58-74](src/hooks/useFocusTrap.ts#L58-L74).

### M28. `report-share` slug collision — TOCTOU race

[api/report-share.ts:72-84](api/report-share.ts#L72-L84). SELECT+INSERT без constraint-fallback. PK поймает, но вернёт generic 500.

### M30. AUDIT.md (старый) устарел

Описывает удалённый `AdminDataContext`, исправленные строки. В добавление к `CODE_REVIEW.md` (этот файл) стоит либо обновить AUDIT.md, либо пометить как историческое.

---

## 🟢 Polish

### P6. `public/visual-led/index.html` — 3481 строка монолита

HTML + inline JS + inline CSS. Тяжело ревьюить/диффать.

### P7. Нет prettier / lint-staged

husky теперь есть (H16 fix) — lint-staged + prettier естественное продолжение.

### P8. `console.info` в prod analytics

[src/lib/analytics.ts:19](src/lib/analytics.ts#L19). Guard в `if (import.meta.env.DEV)`.

### P9. `console.log` в `imageCompression`

`useSiteSettings.ts` удалён (C7 fix), проверить `imageCompression`.

### P10. Stale planning docs

[plans/REFACTORING_PLAN.md](plans/REFACTORING_PLAN.md), [docs/SUPABASE_AUDIT.md](docs/SUPABASE_AUDIT.md) — в `docs/archive/` или удалить.

### P11. `@types/node@25.3.0` vs Vercel Node 22

[package.json:65](package.json#L65). Minor mismatch.

### P12. `site_settings.background_settings` — JSONB без size/shape constraint

[supabase/migrations/20260327_site_settings.sql:5](supabase/migrations/20260327_site_settings.sql#L5). `CHECK (jsonb_typeof = 'object' AND octet_length < 65536)`.

### P13. `backgrounds/reactbits/*.jsx` — mixed с .tsx

Strict-TS проект; `.jsx` обходят type-check.

### P14. Google Fonts — `rel="stylesheet"` блокирует render

[index.html:13](index.html#L13). Self-host или `media="print" onload`.

### P15. `.replit` в git

Dev-flow на Vercel — удалить если не нужен.

### P16. Honeypot / schema consistency

[server/lib/emailCore.js:296-306](server/lib/emailCore.js#L296-L306) проверяет `honey`, Zod-schema в [api/send.ts:93-104](api/send.ts#L93-L104) его не объявляет. Сейчас проходит (не `.strict()`); тонко.

### P17. `vercel.json` — нет pinned runtime

### P18. Нет bundle-analyzer

`rollup-plugin-visualizer`.

---

## Что дальше — приоритеты

**Безопасность (критики нет):**
- H5 — DoS в visual-led/analyze. Single most important, дешёвый.
- H7 — TTL на shared_reports. Дешёво.
- H15 — baseline миграция через `supabase db pull`. Обязательно чтобы репо был самодостаточен.

**DX / надёжность:**
- H11 (сделано) + `ErrorBoundary` вокруг каждого `<Suspense>`, не только корня.
- H14 — явные политики на `visual_led_*` (документирующие intent).
- M18 — хотя бы 3 теста: submitForm, useUserRole (RBAC boundary), /api/send integration.
- M10 — Permissions-Policy / COOP / CORP.

**Тех-долг:**
- M19 — unify email pipeline.
- M11 — раздробить `HomePage.tsx` и остальных гигантов.
- M4/M5 — pagination + useMemo на leads и media.
- M7 — удалить `postprocessing`, chunk-split three/ogl.
- M30 — решить судьбу AUDIT.md.

**Перформанс:**
- H1 — throttle MutationObserver (~10 LOC).
- H13 — убрать direct-DOM в пользу CSS.

---

## Deltas vs AUDIT.md (unchanged)

Новые находки которых нет в оригинальном AUDIT.md: закрыты все C1-C10. Из H/M расширений: H3 (in-memory rate-limit — nonce on serverless), H1 (конкретный хук с точной ценой), H2 (точная строка утечки PII), M11 (конкретные файлы >500 строк), M18 (перечисленные непокрытые пути).

Если AUDIT.md станут поддерживать — стоит свести: оставить один актуальный файл, либо этот (CODE_REVIEW.md) переименовать в AUDIT.md и старый удалить.
