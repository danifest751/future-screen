# План рефакторинга по результатам аудита

**Дата:** 31 марта 2026 г.  
**Основа:** [`AUDIT.md`](../AUDIT.md)  
**Принцип:** Каждый шаг безопасен, не ломает проект, можно остановиться после любого шага

---

## Стратегия

- **Маленькие шаги** — каждый шаг = 1-3 файла, можно закоммитить
- **Безопасность** — после каждого шага проект собирается и работает
- **Проверка** — `npm run build` после каждого шага
- **Откат** — каждый шаг можно откатить без последствий

---

## Этап 1: Безопасные исправления (не ломают ничего)

### Шаг 1.1: Исправить утечки useEffect зависимостей

**Файлы:**
- `src/hooks/useContacts.ts` — добавить `ensureContacts` в зависимости (уже есть, проверить)
- `src/pages/SupabaseCheckPage.tsx` — `checkTables` уже в зависимостях (строка 39)

**Статус:** ✅ Уже исправлено — зависимости на месте

**Проверка:** `npm run build` — без ошибок

---

### Шаг 1.2: Убрать неиспользуемые импорты из AdminContentIndexPage

**Проблема:** В аудите упомянуты неиспользуемые импорты, но при проверке `AdminContentIndexPage.tsx` — чистый, это просто навигационная страница.

**Статус:** ✅ Не требует исправления — страница содержит только навигацию

**Примечание:** Мёртвый код может быть в других страницах админки — нужно проверить отдельно.

---

## Этап 2: Убрать fallback на статические данные

### Шаг 2.1: Убрать fallback в `useContacts.ts`

**Файл:** `src/hooks/useContacts.ts`

**Текущий код:**
```typescript
contacts: contacts.items || baseContacts,
```

**Новый код:**
```typescript
contacts: contacts.items,
```

**Риск:** Если Supabase не загрузил данные, `contacts.items` будет `null` — компоненты должны это обработать.

**Безопасный подход:**
1. Сначала проверить, где используется `useContacts()`
2. Убедиться, что компоненты обрабатывают `null`
3. Затем убрать fallback

**Зависимости для проверки:**
- `src/pages/ContactsPage.tsx`
- `src/components/Footer.tsx`
- `src/pages/admin/AdminContactsPage.tsx`

---

## Этап 3: Добавить Zod валидацию в `api/send.ts`

### Шаг 3.1: Создать схему валидации

**Файл:** `api/send.ts`

**Добавить:**
```typescript
const emailPayloadSchema = z.object({
  source: z.string().max(100).default('Сайт'),
  name: z.string().min(1).max(100),
  phone: z.string().min(5).max(20),
  email: z.string().email().optional().nullable(),
  telegram: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  date: z.string().max(50).optional().nullable(),
  format: z.string().max(100).optional().nullable(),
  comment: z.string().max(1000).optional().nullable(),
  extra: z.record(z.string()).optional().nullable(),
});
```

**Использовать в handler:**
```typescript
const validation = emailPayloadSchema.safeParse(req.body);
if (!validation.success) {
  return res.status(400).json({ error: 'Invalid input', details: validation.error });
}
const payload = validation.data;
```

**Риск:** Минимальный — валидация только отклоняет некорректные данные

---

## Этап 4: Сгенерировать типы Supabase

### Шаг 4.1: Сгенерировать типы из схемы

**Команда:**
```bash
cd future-screen
npx supabase gen types typescript --project-id "pyframwlnqrzeynqcvle" > src/lib/database.types.ts
```

**Файл:** `src/lib/database.types.ts` (будет создан)

**Использование:**
```typescript
import type { Database } from './database.types';

const { data, error } = await supabase
  .from('packages')
  .select('*')
  .returns<Database['public']['Tables']['packages']['Row'][]>();
```

**Риск:** Низкий — типы только помогают, не ломают runtime

**Проверка:** `npm run build` — TypeScript проверит типы

---

## Этап 5: Разделить AdminDataContext (долгосрочный)

### Шаг 5.1: Вынести загрузку ресурсов в отдельные хуки

**Текущий:** `AdminDataContext.tsx` — 427 строк

**План:**
1. Создать `useResourceLoader.ts` — универсальный хук загрузки
2. Создать `usePackagesData.ts`, `useCategoriesData.ts`, и т.д.
3. `AdminDataContext` оставить как объединяющий контекст

**Риск:** Средний — требует рефакторинга, но можно делать постепенно

---

## Этап 6: Добавить тесты

### Шаг 6.1: Тесты для мапперов

**Файл:** `src/services/adminData.test.ts`

**Тестировать:**
- `mapPackageFromDB` — snake_case → camelCase
- `mapPackageToDB` — camelCase → snake_case
- `mapCategoryFromDB`, `mapCategoryToDB`
- `mapContactsFromDB`, `mapContactsToDB`
- `sanitizeServices`

### Шаг 6.2: Тесты для API

**Файл:** `api/send.test.ts`

**Тестировать:**
- Валидация входных данных
- Rate limiting
- CORS

---

## Приоритетный порядок выполнения

| # | Шаг | Сложность | Риск | Время |
|---|-----|-----------|------|-------|
| 1 | Шаг 1.1 — Проверка useEffect | 🟢 Низкая | 🟢 Нет | 5 мин |
| 2 | Шаг 2.1 — Убрать fallback | 🟢 Низкая | 🟡 Средний | 15 мин |
| 3 | Шаг 3.1 — Zod валидация | 🟡 Средняя | 🟢 Нет | 30 мин |
| 4 | Шаг 4.1 — Типы Supabase | 🟡 Средняя | 🟢 Нет | 20 мин |
| 5 | Шаг 6.1 — Тесты мапперов | 🟡 Средняя | 🟢 Нет | 1 час |
| 6 | Шаг 5.1 — Разделить контекст | 🔴 Высокая | 🟡 Средний | 3 часа |

---

## Чек-лист проверки после каждого шага

- [ ] `npm run build` — без ошибок
- [ ] `npm run lint` — без новых предупреждений
- [ ] `npm run test` — все тесты проходят
- [ ] Локально работает (проверить основные страницы)

---

## Рекомендация по порядку

**Начать с шага 2.1** — убрать fallback на статические данные. Это самое критичное исправление, которое не ломает проект, но улучшает надёжность.

**Затем шаг 3.1** — добавить Zod валидацию в API. Это улучшит безопасность.

**Затем шаг 4.1** — сгенерировать типы Supabase. Это улучшит типизацию и предотвратит будущие ошибки.

---

*План создан 31 марта 2026 г. Может обновляться по мере выполнения.*
