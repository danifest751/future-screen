-- Создание таблицы rental_categories для раздела "Оборудование в аренду"
-- Каждая строка = одна категория с полным контентом страницы

CREATE TABLE IF NOT EXISTS rental_categories (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SEO поля
ALTER TABLE rental_categories ADD COLUMN IF NOT EXISTS seo JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Hero блок
ALTER TABLE rental_categories ADD COLUMN IF NOT EXISTS hero JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Описание категории
ALTER TABLE rental_categories ADD COLUMN IF NOT EXISTS about JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Сценарии использования
ALTER TABLE rental_categories ADD COLUMN IF NOT EXISTS use_cases JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Состав услуги
ALTER TABLE rental_categories ADD COLUMN IF NOT EXISTS service_includes JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Преимущества
ALTER TABLE rental_categories ADD COLUMN IF NOT EXISTS benefits JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Галерея
ALTER TABLE rental_categories ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]'::jsonb;

-- FAQ
ALTER TABLE rental_categories ADD COLUMN IF NOT EXISTS faq JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Нижний CTA
ALTER TABLE rental_categories ADD COLUMN IF NOT EXISTS bottom_cta JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Индекс для быстрого поиска по slug
CREATE INDEX IF NOT EXISTS idx_rental_categories_slug ON rental_categories(slug);

-- Индекс для сортировки
CREATE INDEX IF NOT EXISTS idx_rental_categories_sort_order ON rental_categories(sort_order);

-- RLS политики
ALTER TABLE rental_categories ENABLE ROW LEVEL SECURITY;

-- Публичное чтение только для опубликованных
CREATE POLICY "rental_categories_public_read" ON rental_categories
  FOR SELECT USING (is_published = true);

-- Полный доступ для авторизованных (админка)
CREATE POLICY "rental_categories_admin_all" ON rental_categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rental_categories_updated_at
  BEFORE UPDATE ON rental_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
