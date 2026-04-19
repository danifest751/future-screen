# Безопасный план отработки CODE_REVIEW.md

**Источник:** [CODE_REVIEW.md](CODE_REVIEW.md)
**Цель:** закрыть критические уязвимости из отчёта, **не уронив прод**.
**Принципы:** каждый шаг обратим, меняем по одному вектору за раз, перед жёсткими изменениями — shadow/dual-mode период, проверка на preview deploy до main.

---

## Правила игры (соблюдать везде)

1. **Работаем только в feature-ветке** `security/hardening-2026-04`. Никаких прямых коммитов в main.
2. **Каждый PR — одна логическая смена**. Не мешать, например, CSP и RBAC в одном PR.
3. **Vercel Preview Deployment обязателен** до мержа. Проверять на нём через [verify-deploy.yml](../.github/workflows/verify-deploy.yml):
   - HTTP headers (CSP/HSTS/…) соответствуют ожидаемым,
   - главная открывается (200),
   - форма `/api/send` OPTIONS отвечает,
   - `/admin` без авторизации редиректит,
   - `/reports/:slug` открывается,
   - Playwright smoke (E2E) проходит против Preview URL.
4. **DB migrations** — сначала `supabase db diff` на staging, снимок БД (`pg_dump`) в `backups/YYYY-MM-DD/`.
5. **RLS tightening** — сначала `ALTER POLICY` в транзакции с explicit `TO admin_role`, тестируем на preview, **только потом** деплоим.
6. **Feature flag через env var** для рискованных изменений: `FEATURE_STRICT_RBAC=1`, `FEATURE_KV_RATELIMIT=1`. Включается постепенно.
7. **Rollback plan на каждый шаг** — записан в PR description.
8. **Без зелёного `verify-deploy`** — merge заблокирован (GitHub required status check).

---

## PR #0 (пререквизит) — verify-deploy workflow

**Без этого нечем автопроверять остальные PR.** Делаем первым коммитом в ветке `security/hardening-2026-04`.

### Что содержит
- [.github/workflows/verify-deploy.yml](../.github/workflows/verify-deploy.yml):
  - триггер `deployment_status` (Vercel сам шлёт события в GitHub после каждого preview/prod деплоя),
  - job `headers-check` — `curl -I <deployment_url>`, assert:
    - `Content-Security-Policy` содержит ожидаемые директивы,
    - `Strict-Transport-Security` присутствует (после фазы 1),
    - нет `<meta http-equiv="Content-Security-Policy">` в HTML,
  - job `smoke-http` — проверка статусов:
    - `GET /` → 200,
    - `OPTIONS /api/send` → 204,
    - `GET /api/telegram-webhook?action=getWebhookInfo` → 401 (после фазы 2),
    - `GET /admin` без cookie → 302/redirect,
  - job `smoke-e2e` — `npx playwright test --config=playwright.preview.config.ts` с `BASE_URL=${{ github.event.deployment_status.target_url }}`,
  - job `summary` — собирает результаты, постит коммент в PR.
- [playwright.preview.config.ts](../playwright.preview.config.ts) — конфиг для прогона существующих [tests/e2e/](../tests/e2e/) против переданного `BASE_URL` (без `webServer`).
- [scripts/assert-headers.mjs](../scripts/assert-headers.mjs) — чистый node-скрипт проверки headers (без зависимостей).

### Требуемые GitHub Actions secrets
Пользователь добавляет в **Settings → Secrets → Actions**:
- `VERCEL_TOKEN` — для rollback при провале prod-проверок (фаза 7a+).
- (опционально) `PLAYWRIGHT_TEST_USER_EMAIL`, `PLAYWRIGHT_TEST_USER_PASSWORD` — для E2E авторизации.

### Lifecycle PR'а

```
┌────────────────┐   push    ┌──────────────┐   preview    ┌──────────────────┐
│ feature branch ├──────────▶│ Vercel build ├─────────────▶│ deployment_status│
└────────────────┘           └──────────────┘              └────────┬─────────┘
                                                                    │
                                                           ┌────────▼─────────┐
                                                           │ verify-deploy.yml│
                                                           │  ├─ headers      │
                                                           │  ├─ smoke-http   │
                                                           │  └─ smoke-e2e    │
                                                           └────────┬─────────┘
                                                                    │ ✅/❌
                                                           ┌────────▼─────────┐
                                                           │   PR status check│
                                                           └──────────────────┘
```

- ✅ зелёный → merge разрешён → переход к следующему PR.
- ❌ красный → авто-коммент в PR, merge заблокирован. Фиксим → новый push → новый deploy → новая проверка.

---

## Фаза 0. Подготовка (0.5 дня, до любых изменений)

Цель — понять текущее состояние прода, чтобы не сломать вслепую.

### 0.1 Аудит прод-окружения
```bash
# Проверить Vercel env: есть ли всё, на что будем опираться
vercel env ls production
# Искать: SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_WEBHOOK_SECRET,
#         SMTP_PASS, TG_BOT_TOKEN, TG_CHAT_ID, Upstash creds (будущее)
```

**Блокер:** если `SUPABASE_SERVICE_ROLE_KEY` отсутствует — H4 нельзя делать «throw on missing», сначала проставить.

### 0.2 Инвентаризация ролей
Через Supabase SQL editor (service-role):
```sql
SELECT id, email,
       raw_user_meta_data->>'role'  AS user_meta_role,
       raw_app_meta_data->>'role'   AS app_meta_role,
       created_at
FROM auth.users
ORDER BY created_at;
```
Сохранить в `backups/users-roles-snapshot-YYYY-MM-DD.csv`. Понадобится для C2-миграции.

### 0.3 Полный бэкап БД
```bash
pg_dump "<supabase-conn>" > backups/pre-hardening-YYYY-MM-DD.sql
```

### 0.4 Снимок текущих CSP / headers
Для сравнения «до/после» через curl:
```bash
curl -I https://future-screen.ru > backups/headers-before.txt
```

### 0.5 Создать ветку и draft-PR
```bash
git checkout -b security/hardening-2026-04
git push -u origin security/hardening-2026-04
gh pr create --draft --title "Security hardening (tracking)" --body "..."
```

**Check-лист фазы 0:**
- [ ] Vercel env проверен
- [ ] CSV ролей экспортирован
- [ ] pg_dump снят
- [ ] Ветка создана

---

## Фаза 1. Header-only quick wins (1 PR, 1 час, ≈0 риска)

Только [vercel.json](../vercel.json) и [index.html](../index.html). Ноль изменений в логике.

### PR #1: CSP cleanup + security headers

**Что делаем:**
- Удалить `<meta http-equiv="Content-Security-Policy">` из `index.html` (C9). Header из `vercel.json` остаётся.
- В `vercel.json` добавить:
  - `base-uri 'self'` (C10)
  - `form-action 'self'` (C10)
  - `object-src 'none'` (C10)
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (M10)
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()` (M10)
  - `X-Content-Type-Options: nosniff` (C8 предварительно)
- **НЕ трогаем** `unsafe-inline`/`unsafe-eval` в этом PR — отдельной итерацией (требует проверки всех inline-скриптов).

**Проверка на Preview:**
- Главная грузится → форма работает → админка открывается → `/reports/*` открывается → Telegram-бот отвечает.
- Через DevTools → Security: нет CSP violations в консоли.

**Rollback:** `git revert <commit>` — чистый rollback header-only изменений.

---

## Фаза 2. Telegram webhook + service-role hard-fail (1 PR, 2 часа, низкий риск)

Изолированные API-изменения, не затрагивают пользователей сайта.

### PR #2: C1 + H4

**C1 — Auth на GET actions в telegram-webhook**
- [api/telegram-webhook.ts:710-736](../api/telegram-webhook.ts#L710-L736): требовать `Authorization: Bearer <admin-jwt>` через существующий `ensureAdmin`-паттерн (как в `visual-led-logs`).
- POST path: сделать `TELEGRAM_WEBHOOK_SECRET` обязательным — если env не задан, вернуть 500 на boot (не no-op).

**H4 — Throw на missing SUPABASE_SERVICE_ROLE_KEY**
- [api/send.ts:82](../api/send.ts#L82), [api/telegram-webhook.ts:93](../api/telegram-webhook.ts#L93): убрать fallback `|| VITE_SUPABASE_ANON_KEY`. Если env нет → throw при инициализации handler.
- **Предусловие (фаза 0.1):** env проверен в prod и staging.

**Проверка на Preview:**
- `curl /api/telegram-webhook?action=getWebhookInfo` без токена → 401
- `curl /api/telegram-webhook?action=getWebhookInfo` с bearer → 200
- `/api/send` POST отвечает 200, лид создаётся.
- Telegram-бот отвечает на `/start` в группе.

**Rollback:** revert. Preview → staging → prod по 24 ч каждая среда.

---

## Фаза 3. Role gates на админ-роутах (1 PR, 2 часа, низкий риск — клиент)

**Важно:** C3 не требует смены источника роли. Делаем **до** C2, используя текущую `useUserRole`. Когда C2 переедет на `app_metadata`, логика роутов не сломается.

### PR #3: C3 — requiredRole на все /admin/*

- [src/App.tsx:95-107](../src/App.tsx#L95-L107): добавить `requiredRole="admin"` (или `"editor"` где уместно) к каждому admin-маршруту.
- Проверить что `ProtectedRoute` корректно редиректит не-админов.
- Добавить unit-тест для `ProtectedRoute` с `requiredRole`.

**Проверка на Preview:**
- Залогиниться viewer'ом (или создать тестового) → `/admin/leads` редиректит на главную/401.
- Залогиниться админом → все админ-роуты открываются.

**Rollback:** revert. Админы защищены своим паролем, downgrade в худшем случае.

---

## Фаза 4. RBAC migration — user_metadata → app_metadata (3 PR, 1–2 дня, ТРЕБУЕТ КООРДИНАЦИИ)

Самый рискованный блок. Делаем **строго поэтапно** через dual-read.

### PR #4a: Dual-read — читаем оба места, предпочтение app_metadata

- [src/hooks/useUserRole.ts:26](../src/hooks/useUserRole.ts#L26): `role = app_metadata.role ?? user_metadata.role ?? 'viewer'`.
- RLS в [sql/005_rbac_policies.sql:30-33](../sql/005_rbac_policies.sql#L30-L33): создать **новую** policy читающую `auth.jwt()->'app_metadata'->>'role'`, не удаляя старую. `OR` через две policy (Postgres: alternative policies — любая дающая USING=true проходит).

**Результат:** пока в `app_metadata` пусто — всё работает как раньше. Ни один админ не теряет доступ.

**Rollback:** revert кода + `DROP POLICY <new-one>`.

### PR #4b: Backfill app_metadata через service-role скрипт

Скрипт в `scripts/backfill-app-metadata-role.mjs`:
```js
// Для каждого user с user_metadata.role != null:
// supabase.auth.admin.updateUserById(id, { app_metadata: { role: <same> } })
// user_metadata НЕ трогаем
```

Запустить **сначала на staging**, убедиться что `useUserRole` возвращает ту же роль. Потом на prod.

**Проверка:**
```sql
SELECT count(*) FROM auth.users
WHERE raw_user_meta_data->>'role' IS NOT NULL
  AND raw_app_meta_data->>'role' IS NULL;
-- Должно быть 0
```

**Rollback:** скрипт `revert-app-metadata.mjs` — очищает `app_metadata.role`. Старая policy на `user_metadata` всё ещё активна.

### PR #4c: Отрезаем user_metadata (только после 4b в prod + 24 ч мониторинга)

- `useUserRole`: убрать чтение `user_metadata`.
- [sql/005_rbac_policies.sql](../sql/005_rbac_policies.sql): `DROP POLICY` на `user_metadata`, оставить только `app_metadata`.

**Проверка на Preview:**
- Создать тестового пользователя, `supabase.auth.updateUser({ data: { role: 'admin' } })` → роль **не** должна подняться.
- Админ с `app_metadata.role=admin` — работает.

**Rollback:** revert + `CREATE POLICY` обратно. Но только если 4b backfill не поломался.

---

## Фаза 5. Leads data plane (2 PR, 1 день)

Требует чтобы фаза 4 завершилась (иначе ужесточённая RLS выпилит админов).

### PR #5a: C5 — убрать клиентский INSERT в leads (shadow-mode сначала)

**Шаг 1 (shadow):** [src/lib/submitForm.ts:24-57](../src/lib/submitForm.ts#L24-L57) остаётся, но параллельно вызываем `/api/send` **первым** и передаём `saveToDb: true`. Сервер (service-role) делает INSERT. Клиентский INSERT дублирует.

**Шаг 2 (after 48h наблюдения):** убираем клиентский INSERT целиком. В БД должно быть ровно 1 row на лид (проверить по `submitted_at` уникальности).

**Rollback:** вернуть клиентский INSERT, он всё равно разрешён RLS anon-policy.

### PR #5b: C4 — ужесточить RLS на leads

Предусловие: 4c в prod + 5a шаг 2 в prod + 24 ч без жалоб.

- [supabase/migrations/20260220_setup_leads_storage.sql:28-29](../supabase/migrations/20260220_setup_leads_storage.sql#L28-L29): вместо `auth.role() = 'authenticated'` — `(auth.jwt()->'app_metadata'->>'role') = 'admin'`.
- Добавить колонку `deleted_at timestamptz`, перевести `useClearLeadsMutation` на soft-delete.
- Создать таблицу `audit_log` (user_id, action, entity, payload, at).

**Проверка на Preview:**
- Анонимно отправить форму → лид создан (через `/api/send` service-role).
- Залогинен editor → не видит лидов (403).
- Залогинен admin → видит и может soft-delete.

**Rollback:** обратная миграция восстанавливает старую policy.

---

## Фаза 6. Stored XSS на /reports (1 PR, 0.5 дня)

### PR #6: C8 — DOMPurify server-side + sandbox CSP

- [api/report-share.ts:54-61](../api/report-share.ts#L54-L61): заменить `.includes('<script')` на server-side DOMPurify (`isomorphic-dompurify` + `jsdom`).
- [vercel.json](../vercel.json): для пути `/reports/*` — отдельный header-блок:
  ```
  Content-Security-Policy: sandbox allow-same-origin; default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data: https:
  ```
- Backfill existing rows: скрипт `scripts/resanitize-shared-reports.mjs` — проходит по всем rows, перезаписывает `html` через DOMPurify.

**Проверка:**
- Существующие отчёты открываются.
- Попытка вставить `<img src=x onerror=alert(1)>` через POST → сохраняется без `onerror`.
- `/reports/foo` не может вызвать `fetch('/api/leads')` (CSP).

**Rollback:** revert CSP header и DOMPurify. Уязвимость возвращается, но не ломает функционал.

---

## Фаза 7. Инфраструктура устойчивости (2 PR, 1 день)

Не блокирует предыдущие, можно параллельно.

### PR #7a: H3 — Upstash KV rate-limit

- Подключить `@upstash/ratelimit` + `@upstash/redis`.
- [api/send.ts](../api/send.ts), [api/client-log.ts](../api/client-log.ts): заменить in-memory Map.
- Feature-flag: `FEATURE_KV_RATELIMIT=1`. Если flag off или Upstash unreachable — fallback на текущий in-memory (чтобы не дать 500).

### PR #7b: H16 — GitHub Actions + husky + gitleaks

- `.github/workflows/verify.yml`: lint + test + build на PR.
- `.husky/pre-commit`: `lint-staged` + `gitleaks protect --staged`.
- **НЕ делать** force-push чтобы переписать историю (утечка ключей). Ключи **ротировать** через Supabase dashboard / BotFather, а в истории оставить — переписывание git history сломает всех контрибьюторов.

---

## Фаза 8. Quick wins из H/M-секций (batch-PR, 0.5 дня)

Можно одним PR, по файлу:

- **H2** ([src/components/RequestForm.tsx:63](../src/components/RequestForm.tsx#L63)): отфильтровать PII из `trackEvent`.
- **H8**: `isOriginAllowed` на POST → reject empty Origin.
- **H9** ([sql/005_rbac_policies.sql:56-60](../sql/005_rbac_policies.sql#L56-L60)): `TO anon, authenticated USING (is_published=true)` для `site_content`.
- **H10** ([src/lib/sanitize.ts:55-60](../src/lib/sanitize.ts#L55-L60)): убрать `style` из allowed attributes.
- **H11**: обернуть `<App>` в `<ErrorBoundary>` в [src/main.tsx](../src/main.tsx).
- **H12** ([src/lib/clientErrorLogger.ts:62-84](../src/lib/clientErrorLogger.ts#L62-L84)): убрать monkey-patch `console.error`, оставить только `window.error` + `unhandledrejection` + sampling.
- **M12** ([src/pages/admin/AdminLeadsPage.tsx:392-407](../src/pages/admin/AdminLeadsPage.tsx#L392-L407)): CSV-injection fix — префикс `'` на `=+-@\t\r`.
- **M20** ([src/components/ConsentCheckbox.tsx:33](../src/components/ConsentCheckbox.tsx#L33)): добавить `rel="noopener noreferrer"`.

Каждое — мелочь, но ломать не может. Ревьюить одним PR, мержить сразу.

---

## Фаза 9. Оставшееся (месяц+)

C6/C7 (site_settings id mismatch + dead legacy hook), H1 (MutationObserver throttle), H5–H7, H13–H15, M-серия рефакторингов, P-polish. Делаем **после** того как критика закрыта. Детали уже есть в CODE_REVIEW.md — план не нужен, просто backlog.

---

## Сводная таблица рисков и порядка

| Фаза | PR | Риск | Rollback | Блокирует |
|------|----|------|----------|-----------|
| 0 | verify-deploy workflow | 🟢 low | revert | **все последующие** |
| 1 | CSP headers | 🟢 low | revert | — |
| 2 | C1 + H4 | 🟢 low | revert | — |
| 3 | C3 role gates | 🟢 low | revert | — |
| 4a | dual-read RBAC | 🟢 low | revert + DROP POLICY | 4b |
| 4b | backfill script | 🟡 medium | revert-script | 4c |
| 4c | remove user_metadata path | 🟠 high | восстановить policy | 5b |
| 5a | shadow INSERT | 🟡 medium | revert | 5b |
| 5b | tight leads RLS | 🟠 high | обратная миграция | — |
| 6 | /reports sanitize | 🟡 medium | revert | — |
| 7a | Upstash KV | 🟢 low (за flag) | disable flag | — |
| 7b | CI/husky | 🟢 low | revert | — |
| 8 | batch quick wins | 🟢 low | revert | — |

---

## Что НЕ делаем (осознанно)

- **Force-push для переписывания git history** с утёкшими ключами. Ротируем ключи, история остаётся — ломать форки и клоны не стоит.
- **Трогать `unsafe-inline`/`unsafe-eval` в CSP** в первой волне. Требует аудита всех inline-скриптов (Yandex-Metrika, React hydration, Vite legacy). Отдельная задача после фазы 8.
- **Миграция Supabase session на httpOnly cookies**. Большая работа, требует SSR-слоя. В backlog.
- **Рефакторинг 800-строчных компонентов** параллельно с безопасностью. Сначала закрыть критику, потом рефакторить.

---

## Стартовый чек-лист

- [ ] Фаза 0.1 — `vercel env ls production` (пользователь)
- [ ] Фаза 0.2 — CSV ролей (пользователь)
- [ ] Фаза 0.3 — pg_dump (пользователь)
- [ ] Добавить GitHub Secret `VERCEL_TOKEN` (пользователь)
- [ ] Создать ветку `security/hardening-2026-04` ✅
- [ ] PR #0 — verify-deploy workflow ✅
- [ ] PR #1 — headers (первая боевая проверка workflow'а)
- [ ] Далее по таблице фаз.

Каждый PR маленький и независимый, откат в одно `git revert`. Между PR'ами — автопроверка на preview deploy.
