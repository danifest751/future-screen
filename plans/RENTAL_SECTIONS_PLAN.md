# План реализации раздела «Оборудование в аренду»

**Дата:** 31 марта 2026 г.  
**Основа:** [`future-screen-rental-sections-brief.md`](../future-screen-rental-sections-brief.md)  
**Принцип:** Единый шаблон → 8 категорий → CMS-редактирование

---

## Стратегия

- **Единый шаблон** — одна страница `RentalCategoryPage.tsx` собирается из компонентов
- **CMS через Supabase** — одна таблица `rental_categories` с JSON-полями для массивов
- **Контент нейтральный** — без брендов, моделей, цен, конкретных характеристик
- **Каждая категория уникальна** — разные сценарии, преимущества, FAQ, CTA-углы

---

## Архитектура

### Структура данных (Supabase)

```
rental_categories
├── id (int, PK)
├── slug (text, unique)          — URL: /rent/{slug}
├── name (text)                  — название категории
├── short_name (text)            — для карточек
├── is_published (boolean)       — статус публикации
├── sort_order (int)             — порядок сортировки
├── seo (jsonb)                  — meta title, description, og, canonical
├── hero (jsonb)                 — title, subtitle, cta, highlights, background
├── about (jsonb)                — title, text, items[]
├── use_cases (jsonb)            — title, items[] {title, description, icon}
├── service_includes (jsonb)     — title, items[]
├── benefits (jsonb)             — title, items[] {title, description, icon}
├── gallery (jsonb)              — items[] {image, alt, caption}
├── faq (jsonb)                  — title, items[] {question, answer}
└── bottom_cta (jsonb)           — title, text, primaryCta, secondaryCta
```

### Фронтенд-компоненты

```
src/components/rental/
├── RentalHero.tsx          — Hero-блок с фоном и CTA
├── RentalAbout.tsx         — Описание категории
├── RentalUseCases.tsx      — Сценарии использования (карточки)
├── RentalServiceIncludes.tsx — Состав услуги (список)
├── RentalBenefits.tsx      — Преимущества (карточки с иконками)
├── RentalGallery.tsx       — Галерея изображений
├── RentalFaq.tsx           — FAQ (аккордеон)
└── RentalCta.tsx           — CTA-блок внизу

src/pages/RentalCategoryPage.tsx  — Единый шаблон страницы
```

### Админка

```
src/pages/admin/AdminRentalCategoriesPage.tsx  — Список категорий
src/pages/admin/AdminRentalCategoryEditPage.tsx — Редактирование категории
```

---

## 8 категорий

На основе текущих данных проекта (`src/data/categories.ts`):

| # | Slug | Название | Роль |
|---|------|----------|------|
| 1 | `light` | Световое оборудование | Освещение сцен, площадок, архитектурная подсветка |
| 2 | `video` | Видеооборудование | Экраны, проекторы, коммутация, трансляции |
| 3 | `sound` | Звуковое оборудование | Звуковые системы, микрофоны, микшеры |
| 4 | `stage` | Сцены и подиумы | Сценические конструкции, фермы, подиумы |
| 5 | `instruments` | Музыкальные инструменты | Бэклайн, инструменты для выступлений |
| 6 | `computers` | Компьютеры и ноутбуки | Видеомикширование, стриминг, презентации |
| 7 | `touchscreens` | Тачскрины | Интерактивные панели, навигация, опросы |
| 8 | `staff` | Технический персонал | Звукорежиссёры, световики, монтажники |

---

## Пошаговый план

### Этап 1: CMS-структура (Supabase)
**Файлы:** `sql/`, `src/lib/database.types.ts`

1. Создать SQL миграцию для таблицы `rental_categories`
2. Добавить типы в `database.types.ts`
3. Создать хук `useRentalCategory(slug)` для загрузки данных
4. Создать хук `useRentalCategories()` для списка

**Результат:** Таблица в Supabase, хуки для чтения/записи

---

### Этап 2: Единый шаблон страницы
**Файлы:** `src/pages/RentalCategoryPage.tsx`, `src/components/rental/*`

1. Создать 8 компонентов блоков (Hero, About, UseCases, ServiceIncludes, Benefits, Gallery, Faq, Cta)
2. Создать `RentalCategoryPage.tsx` — собирает страницу из компонентов
3. Каждый компонент получает данные из props, рендерит только если данные есть
4. Пустые блоки скрываются автоматически

**Результат:** Шаблон страницы, готовый к наполнению

---

### Этап 3: Первичное наполнение контентом
**Файлы:** SQL INSERT или seed-скрипт

Для каждой из 5 категорий подготовить:
- **Hero:** H1, подзаголовок, 2 CTA, 3-4 highlights
- **About:** заголовок, 1-2 абзаца, 4-6 пунктов
- **UseCases:** 6-8 сценариев (деловые, выставки, концерты, частные, презентации, конференции, бренд-зоны, уличные)
- **ServiceIncludes:** 5-8 пунктов состава услуги
- **Benefits:** 4-6 преимуществ с иконками
- **Gallery:** 3-4 заглушки изображений
- **Faq:** 5-8 вопросов с ответами
- **BottomCta:** заголовок, текст, 2 кнопки
- **SEO:** meta title, description, og title, og description

**Результат:** 5 заполненных категорий в Supabase

---

### Этап 4: Админка для редактирования
**Файлы:** `src/pages/admin/AdminRentalCategoriesPage.tsx`, `AdminRentalCategoryEditPage.tsx`

1. Страница списка категорий (таблица с названием, slug, статусом)
2. Страница редактирования — форма с секциями по блокам
3. Каждая секция сворачивается/разворачивается
4. Массивы (useCases, benefits, faq, gallery) — добавление/удаление/перестановка элементов
5. Кнопки: сохранить, сбросить, предпросмотр

**Результат:** Контент-менеджер может редактировать все поля без разработчика

---

### Этап 5: Роутинг и SEO
**Файлы:** `src/App.tsx`, `src/pages/RentalCategoryPage.tsx`

1. Добавить роут `/rent/:slug` → `RentalCategoryPage`
2. Динамический meta title/description из SEO-полей категории
3. Open Graph теги из SEO-полей
4. Canonical URL
5. Breadcrumbs (хлебные крошки)
6. Обновить страницу `/rent` — список категорий со ссылками

**Результат:** Страницы доступны по URL, индексируются поисковиками

---

### Этап 6: Интеграция с существующим кодом
**Файлы:** `src/data/categories.ts`, `src/hooks/useCategories.ts`

1. Обновить `useCategories` — загружает из Supabase `rental_categories`
2. Обновить `RentPage.tsx` — использует данные из CMS
3. Обновить `RentCategoryPage.tsx` — редирект на новый шаблон или замена

**Результат:** Бесшовная интеграция с существующим разделом аренды

---

## Приоритетный порядок

| # | Этап | Сложность | Зависимости |
|---|------|-----------|-------------|
| 1 | CMS-структура (SQL + типы) | 🟢 Низкая | — |
| 2 | Хуки для чтения данных | 🟢 Низкая | Этап 1 |
| 3 | Компоненты блоков (8 шт) | 🟡 Средняя | — |
| 4 | Единый шаблон страницы | 🟡 Средняя | Этап 3 |
| 5 | Первичное наполнение контентом | 🟡 Средняя | Этап 1 |
| 6 | Роутинг и SEO | 🟢 Низкая | Этап 4 |
| 7 | Админка редактирования | 🔴 Высокая | Этап 1, 4 |
| 8 | Интеграция с существующим кодом | 🟡 Средняя | Этап 6 |

---

## Чек-лист проверки

- [x] SQL миграция выполнена ([`001_create_rental_categories.sql`](../sql/001_create_rental_categories.sql))
- [x] Типы Supabase обновлены ([`database.types.ts`](../src/lib/database.types.ts))
- [x] Хуки загружают данные ([`rentalCategories.ts`](../src/services/rentalCategories.ts))
- [x] 8 компонентов блоков созданы ([`src/components/rental/`](../src/components/rental/))
- [x] Шаблон страницы работает ([`RentalCategoryPage.tsx`](../src/pages/RentalCategoryPage.tsx))
- [x] 8 категорий наполнены контентом ([`002_seed_rental_categories.sql`](../sql/002_seed_rental_categories.sql)) — 5 базовых + компьютеры, тачскрины, персонал
- [x] Роут `/rent/:slug` работает ([`App.tsx`](../src/App.tsx))
- [x] SEO meta-теги динамические (в [`RentalCategoryPage.tsx`](../src/pages/RentalCategoryPage.tsx))
- [x] Админка редактирования работает ([`AdminRentalCategoriesPage.tsx`](../src/pages/admin/AdminRentalCategoriesPage.tsx), [`AdminRentalCategoryEditPage.tsx`](../src/pages/admin/AdminRentalCategoryEditPage.tsx))
- [x] Интеграция с существующим `/rent`
- [x] Адаптивность (mobile, tablet, desktop)
- [x] Пустые блоки скрываются
- [x] `npm run build` проходит

---

## Рекомендация по порядку

**Начать с этапа 1** — создать SQL таблицу и типы. Это фундамент, без которого ничего не работает.

**Затем этап 3** — компоненты блоков. Их можно делать параллельно с наполнением контента.

**Затем этап 5** — наполнить 5 категорий контентом. Это можно делать в текстовом редакторе, не дожидаясь админки.

**Затем этап 4** — шаблон страницы, роутинг, SEO.

**В конце этап 7** — админка. Это самая сложная часть, но без неё можно жить на старте (контент уже в БД).

---

*План создан 31 марта 2026 г.*
