# Аудит миграции на Supabase

**Дата:** Февраль 2026
**Проект:** FS-GPT (Future Screen)
**Статус:** ⚠️ Требуется масштабный рефакторинг хуков (Критичные ошибки маппинга данных).

## 1. Корень проблемы: Конфликт Casing-а (camelCase vs snake_case)
Главная архитектурная проблема текущей миграции заключается в том, что фронтенд ожидает свойства объектов в формате `camelCase` (как это было в локальных файлах `src/data/*.ts`), а база данных Supabase (PostgreSQL) возвращает колонки в формате `snake_case`.

В хуках получения данных (например, `usePackages.ts`) ответ от Supabase напрямую передаётся в React State без преобразования (DTO/маппинга):

```typescript
// Ожидается фронтендом (src/data/packages.ts):
export type Package = {
  id: string;
  name: string;
  forFormats: string[]; // <-- camelCase
  includes: string[];
  options?: string[];
  priceHint?: string;   // <-- camelCase
};

// Возвращается из Supabase (PostgreSQL):
{
  "id": "light",
  "name": "Лайт",
  "for_formats": ["..."], // <-- snake_case
  "price_hint": "от 50 000" // <-- snake_case
}
```

### Последствия:
1. **Чтение:** UI-компоненты обращаются к `package.priceHint` и получают `undefined`, так как в данных лежит `price_hint`.
2. **Запись:** При вызове `upsert` в БД отправляется объект с ключами `forFormats` и `priceHint`. Supabase отвергает запрос с ошибкой "column forFormats does not exist".

### Затронутые хуки:
- 🔴 `usePackages.ts` (`for_formats`, `price_hint`)
- 🔴 `useCategories.ts` (`short_description`, `page_path`)
- 🔴 `useContacts.ts` (`working_hours`)
- 🟡 `useCases.ts` (тут совпадение выше, так как поля однословные: `slug`, `city`, `date`, но есть `created_at`).

---

## 2. Скрытие ошибок (Антипаттерн Fallback)
Во всех хуках (`usePackages`, `useCategories`, `useContacts`, `useCases`) реализован крайне опасный для продакшена антипаттерн:

```typescript
try {
  const { data, error } = await supabase.from('packages').select('*');
  if (error) {
    setItems(basePackages); // <-- СКРЫТИЕ ОШИБКИ
  }
} catch (err) {
  setItems(basePackages); // <-- СКРЫТИЕ ОШИБКИ
}
```

Если запрос падает (например, из-за ошибки в структуре таблиц или неверного RLS), приложение *молча* подставляет старые данные из файловой БД (`src/data/*.ts`).
Это создает ложную иллюзию того, что сайт работает нормально, хотя на самом деле он отвязан от БД, и изменения из админки никогда не применятся для конечных пользователей.

---

## 3. Статический анализ и мертвый код (ESLint & TSC)
Запуск `tsc --noEmit` и `eslint` выявил 11 предупреждений. Наиболее критичные из них касаются админки:

- `AdminContentPage.tsx`:
  Импортируются, но **не используются** функции и переменные:
  - `cases`
  - `deleteCase`
  - `resetCases`
  - `submitCase`
  - `startEditCase`
  Это означает, что вкладка управления кейсами (`Cases`) в админке либо сломана, либо закомментирована, и управлять кейсами сейчас невозможно.

- Утечки `useEffect` зависимостей:
  - `useContacts.ts`: пропущена зависимость `loadContacts`.
  - `SupabaseCheckPage.tsx`: пропущена зависимость `checkTables`.

---

## 4. План исправления (Рекомендации)

### Этап 1: Создание DTO (Мапперов)
Необходимо написать функции-трансформеры в каждом хуке, которые будут переводить `snake_case` из БД в `camelCase` для фронтенда, и наоборот перед отправкой `upsert`.

Пример для `usePackages`:
```typescript
// Чтение (DB -> Frontend)
const mapPackageFromDB = (row: any): Package => ({
  id: row.id,
  name: row.name,
  forFormats: row.for_formats,
  includes: row.includes,
  options: row.options,
  priceHint: row.price_hint,
});

// Запись (Frontend -> DB)
const mapPackageToDB = (pkg: Package) => ({
  id: pkg.id,
  name: pkg.name,
  for_formats: pkg.forFormats,
  includes: pkg.includes,
  options: pkg.options,
  price_hint: pkg.priceHint,
});
```

### Этап 2: Удаление Fallback-логики
Убрать импорты `basePackages`, `baseCategories` из хуков.
Если Supabase возвращает ошибку, хук должен устанавливать стейт `error` (чтобы UI показал заглушку "Не удалось загрузить данные") или возвращать пустой массив, но **не подменять** данные старой статикой. Статические файлы из `src/data/` можно оставить только для функции "Сбросить к заводским настройкам" (Seed).

### Этап 3: Починка AdminContentPage
Восстановить работоспособность вкладки "Кейсы" в `AdminContentPage.tsx`. Подключить неиспользуемые переменные (`submitCase`, `deleteCase`, `startEditCase`) к JSX-разметке формы.

### Этап 4: Настройка типов Supabase
Сгенерировать типы TypeScript напрямую из схемы Supabase с помощью CLI:
`npx supabase gen types typescript --project-id "твой-id" > src/lib/database.types.ts`
Это позволит TypeScript ругаться на этапе компиляции, если вы попытаетесь передать `priceHint` в таблицу, где ожидается `price_hint`.
