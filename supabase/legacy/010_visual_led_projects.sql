-- Migration 010: visual_led_projects — публичные share-ссылки для визуализатора
--
-- UX: пользователь открывает /visual-led, настраивает сцену, жмёт "Сохранить".
-- Бэкенд кладёт state в JSONB, возвращает UUID. Клиент показывает URL
-- /visual-led?project=<uuid>. Анонимно, без авторизации — как codepen.
--
-- Безопасность:
--   SELECT — публичный (кто угодно с URL читает проект).
--   INSERT/UPDATE/DELETE — только service_role (server-owned).
--   Rate-limit на save — в api/visual-led/save.ts через Upstash.
--   Размер payload — валидация в api/visual-led/save.ts (макс ~500KB).

CREATE TABLE IF NOT EXISTS visual_led_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS visual_led_projects_created_at_idx
  ON visual_led_projects (created_at DESC);

ALTER TABLE visual_led_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read visual_led_projects" ON visual_led_projects;
CREATE POLICY "Public read visual_led_projects"
  ON visual_led_projects
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE — нет политик для anon/authenticated => только service_role.
