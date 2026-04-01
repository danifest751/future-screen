-- Создание таблицы site_content для хранения контента сайта (политика конфиденциальности и др.)
CREATE TABLE IF NOT EXISTS site_content (
    id TEXT PRIMARY KEY DEFAULT 'privacy_policy',
    key TEXT UNIQUE NOT NULL,
    title TEXT,
    content TEXT,
    content_html TEXT,
    meta_title TEXT,
    meta_description TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска по ключу
CREATE INDEX IF NOT EXISTS idx_site_content_key ON site_content(key);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_site_content_updated_at
    BEFORE UPDATE ON site_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Политика RLS (Row Level Security)
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Политика: только аутентифицированные пользователи могут читать
CREATE POLICY "Authenticated users can read site_content"
    ON site_content FOR SELECT
    TO authenticated
    USING (true);

-- Политика: только авторизованные пользователи могут изменять
CREATE POLICY "Authenticated users can update site_content"
    ON site_content FOR UPDATE
    TO authenticated
    USING (true);

-- Политика: только авторизованные пользователи могут удалять
CREATE POLICY "Authenticated users can delete site_content"
    ON site_content FOR DELETE
    TO authenticated
    USING (true);

COMMENT ON TABLE site_content IS 'Таблица для хранения контента сайта (политика конфиденциальности, пользовательское соглашение и т.д.)';
COMMENT ON COLUMN site_content.key IS 'Уникальный ключ контента (privacy_policy, terms_of_service и т.д.)';
COMMENT ON COLUMN site_content.content IS 'Контент в Markdown формате';
COMMENT ON COLUMN site_content.content_html IS 'Контент в HTML формате (рендерится из Markdown)';
