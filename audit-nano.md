# Аудит проекта (nano)

**Дата:** 2026-03-18

## Критично

1. **Telegram bot token в клиенте**: [`src/lib/telegram.ts`](src/lib/telegram.ts:1) — секрет утечёт в браузер.
2. **Открытые тестовые роуты**: в [`src/App.tsx`](src/App.tsx:124) доступны `/test-supabase` и `/check-supabase` без защиты.
3. **Тесты не запускаются**: [`src/utils/screenMath.test.ts`](src/utils/screenMath.test.ts:1) — Vitest v4 не распознаёт suite.
4. **TypeScript не проходит компиляцию**: отсутствуют типы/модули (`react-hot-toast`, `@supabase/supabase-js`) + неявные `any` в [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx:29) и [`src/hooks/useLeads.ts`](src/hooks/useLeads.ts:59).

## Высокий риск

1. **Дублирование бэкенда**: [`server/index.js`](server/index.js:233) и [`api/send.ts`](api/send.ts:350) содержат аналогичную бизнес-логику (Telegram/Email/rate limit).
2. **Дефицит тестов**: кроме одного unit-теста нет покрытия для `lib/`, `hooks/`, `utils/`.
3. **18–19 уязвимостей npm (npm audit)**: в основном транзитивные от `@vercel/*` / `vite` / `eslint`.

## Средне/низкий приоритет

- Монолитные админ-страницы в `src/pages/admin/`.
- Отсутствует CI/CD (автоматический lint/tsc/vitest).
- `useUnsavedChangesGuard` использует `UNSAFE_NavigationContext`.
- В коде есть hardcoded-константы (SMTP/таймауты/rate limit).

## Первые шаги (рекомендации)

1. Убрать/защитить тестовые роуты.
2. Перенести Telegram отправку на сервер (убрать token из браузера).
3. Починить Vitest (или адаптировать тесты под v4 / вернуться на v3).
4. Дотянуть типы (`react-hot-toast`, `@supabase/supabase-js`) и устранить неявный `any`.
5. Добавить минимальные unit-тесты для `lib/` и `utils/`.

