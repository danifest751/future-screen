-- Таблица заявок (Leads)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    telegram TEXT,
    city TEXT,
    date TEXT,
    format TEXT,
    comment TEXT,
    extra JSONB DEFAULT '{}'::jsonb,
    page_path TEXT,
    referrer TEXT,
    status TEXT DEFAULT 'new'
);

-- Настраиваем RLS (Row Level Security)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Любой анонимный пользователь (клиент на сайте) может вставлять заявку
CREATE POLICY "Allow anonymous inserts" ON public.leads
    FOR INSERT WITH CHECK (true);

-- Только авторизованные пользователи (админы) могут читать/обновлять заявки
CREATE POLICY "Allow authenticated full access" ON public.leads
    FOR ALL USING (auth.role() = 'authenticated');

-- Создаем бакет для изображений (Cases)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Политика: загружать, обновлять, удалять могут только авторизованные
CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (bucket_id = 'images');

-- Политика: читать могут все
CREATE POLICY "Allow public read" ON storage.objects
    FOR SELECT USING (bucket_id = 'images');
