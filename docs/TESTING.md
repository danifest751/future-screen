# Тестирование

Конвенции для проекта. Что подключено, что не подключено, как мокать
типичные зависимости. Если пишешь новый тест — пробегись по этому файлу
прежде чем тащить шаблон из другого проекта.

---

## Стек

- **Unit / component:** [Vitest](https://vitest.dev) с `jsdom` —
  [vitest.config.ts](../vitest.config.ts) включает `src/**/*.test.ts(x)`
  и `server/**/*.test.ts`.
- **E2E:** [Playwright](https://playwright.dev) — [playwright.config.ts](../playwright.config.ts)
  поднимает `npm run dev` на порту 4174 и гоняет chromium-проект.
- **Coverage:** v8 через `@vitest/coverage-v8`. Threshold'ы в
  [vitest.config.ts](../vitest.config.ts): lines / statements / functions ≥ 70 %,
  branches ≥ 60 %.

```bash
npm test                       # все unit-тесты
npx vitest run path/to/file    # один файл
npm run test:e2e               # playwright (нужен билд для dev-сервера)
npm run test:e2e -- some-file  # один e2e spec
```

---

## Глобальный setup

### `@testing-library/jest-dom`

`vitest.setup.ts` подключает `@testing-library/jest-dom/vitest`, поэтому
`expect(el).toBeInTheDocument()`, `toHaveAttribute()`, `toHaveClass()` и
другие DOM matchers доступны во всех Vitest-тестах.

```ts
expect(button).toBeInTheDocument();
expect(button).toHaveAttribute('aria-pressed', 'true');

// Vanilla DOM ассерты тоже ок, когда они читаются проще.
expect(button).not.toBeNull();
expect(button.getAttribute('aria-pressed')).toBe('true');
expect(button.textContent).toContain('Сохранить');
```

Образцы — [FilterPills.test.tsx](../src/components/admin/ui/FilterPills.test.tsx),
[ConfirmModal.test.tsx](../src/components/admin/ui/ConfirmModal.test.tsx).

---

## React-хуки

`renderHook` + `act` из `@testing-library/react`. Шаблонный тест с
моками контекстов и `react-hot-toast` —
[useEditableSave.test.tsx](../src/hooks/useEditableSave.test.tsx).

```ts
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const { result } = renderHook(() => useMyHook(), {
  wrapper: ({ children }) => (
    <I18nContext.Provider value={MOCK_I18N}>{children}</I18nContext.Provider>
  ),
});

act(() => result.current.doSomething());
```

---

## Supabase: chain-mocker через Proxy

`supabase.from(...).select(...).eq(...).single()` — длинная цепочка.
Мокать каждый метод отдельно — кошмар. В проекте принят универсальный
Proxy-mocker, который возвращает `Promise<{ data, error }>` на любую
терминальную операцию (`single`, `maybeSingle`, и т.д.).

Образцы:
- [siteContentVersions.test.ts](../src/services/siteContentVersions.test.ts)
- [mediaUsage.test.ts](../src/services/mediaUsage.test.ts)

```ts
import { vi } from 'vitest';

const makeChain = (terminalResult: { data: unknown; error: unknown }) =>
  new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === 'single' || prop === 'maybeSingle') {
          return () => Promise.resolve(terminalResult);
        }
        // every other method (select / eq / order / range / ...)
        // returns the same proxy so chaining works.
        return () => proxy;
      },
    },
  );

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => makeChain({ data: [{ id: 1 }], error: null })),
  },
}));
```

---

## API-handler'ы (`api/*.ts`, `server/lib/*.ts`)

Импорти модуль напрямую и мокай зависимые подмодули через `vi.mock`.
Помни: `vi.mock` поднимается hoisted-вверх, поэтому пиши его **до**
импорта тестируемого модуля.

Образцы:
- [server/lib/telegramWebhook/uploadFlow.test.ts](../server/lib/telegramWebhook/uploadFlow.test.ts) — мокаем `./sessions`, `./telegramApi`, `./tags`, `./supabaseClient`.
- [server/lib/telegramWebhook/rbac.test.ts](../server/lib/telegramWebhook/rbac.test.ts) — pure-функции без моков.

Для тестов `VercelRequest`/`VercelResponse` — соберите минимальный
shape вручную (mock методов `setHeader`, `status`, `json`, `end`).
Не подтягивайте `@vercel/node` целиком — оно не поднимется в jsdom.

---

## E2E (Playwright)

### Поднятие сервера

`playwright.config.ts` запускает `npm run dev` на 4174, **не**
переиспользует существующий (`reuseExistingServer: false`). Каждый
прогон поднимает свой dev-сервер — тесты не зависят от того, что у
тебя сейчас в браузере.

### Onboarding gate в visualLed

Editor (`/visual-led`, `/visual-led/v2`) перехватывается `PresetPicker`
до тех пор, пока не выбран пресет / не загружен проект / не добавлен
экран. E2E, которые хотят редактор-shell, дёргают helper:

```ts
const dismissOnboarding = async (page: Page) => {
  const skip = page.getByRole('button', { name: /Свой вариант/ }).first();
  if (await skip.isVisible({ timeout: 1500 }).catch(() => false)) {
    await skip.click();
  }
};
```

Если хочешь обойти gate через preloaded state — задай в payload
`selectedPresetSlug: '__custom__'`. Образец — `loadedProjectPayload` в
[visual-led-workflows.spec.ts](../tests/e2e/visual-led-workflows.spec.ts).

### Supabase-моки в E2E

Перехват сетевых запросов через `page.route('**/...', ...)`. Полный
набор стабов — [tests/e2e/helpers/supabaseMock.ts](../tests/e2e/helpers/supabaseMock.ts).
Если добавляешь новый запрос на `site_content` или RPC — добавь handler
туда же, иначе E2E будут падать с timeout'ом.

### Viewport per test

Адаптивные тесты используют `test.use({ viewport: ... })` per
describe-block. Образец — [visual-led-responsive.spec.ts](../tests/e2e/visual-led-responsive.spec.ts).

```ts
test.describe('Phone (375×812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  // ...
});
```

---

## Что покрыто, что нет

См. [docs/ai-code-review.md](./ai-code-review.md) (раздел "Тестирование").
Кратко на момент 2026-04-27:

- ✅ Чистые функции (`screenMath`, `geometry`, `cabinet`, `pricing`) — ~100 %.
- ✅ `server/lib/sendApi/*`, `server/lib/telegramWebhook/*` — 90-100 %.
- ⚠️ `report-share`, `telegram-webhook` — есть, не все endpoint'ы.
- ❌ `api/send.ts` — 0 тестов (главный денежный endpoint!).
- ❌ `api/visual-led/*` — 0 тестов.
- ❌ React-компоненты — 0 unit-тестов (кроме `admin/ui/`).
- ✅ E2E (Playwright) — 5 spec-файлов, ~900 строк.

---

## Coverage threshold'ы

Перечень покрываемых модулей — `coverage.include` в
[vitest.config.ts](../vitest.config.ts). Если добавляешь новый модуль,
не забудь добавить его в include — иначе он не считается в threshold.

CI пока coverage не enforce'ит, но `npm run test -- --coverage` локально
поможет понять что не покрыто.
