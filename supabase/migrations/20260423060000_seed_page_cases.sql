-- Seed page_cases into site_content. Mirrors src/content/pages/cases.ts.
-- The videoOverlay.many(n) function is serialized as a `{count}`-template
-- string (`manyTemplate`) so it can live in JSONB.

INSERT INTO public.site_content (id, key, content, content_en, is_published)
VALUES (
  'page_cases',
  'page_cases',
  $ru${"seo":{"title":"Кейсы — реализованные проекты | Фьючер Скрин","description":"Портфолио реализованных проектов: форумы, концерты, выставки. Цифры, состав работ и фото."},"section":{"title":"Кейсы","subtitle":"Реализованные проекты с цифрами и составом работ"},"videoOverlay":{"watch":"Смотреть видео","manyTemplate":"{count} видео"},"emptyState":"Кейсы пока не добавлены","details":{"titleSuffix":"— кейс | Фьючер Скрин","servicesLabel":"Услуги:","videosLabel":"Видео","contactPrompt":"Нужны детали?","contactLink":"Свяжитесь с нами","requestTitle":"Запросить похожий проект","requestSubtitle":"Опишите формат и сроки — предложим конфигурацию","requestCta":"Обсудить"}}$ru$,
  $en${"seo":{"title":"Cases — Completed Projects | Future Screen","description":"Portfolio of completed projects: forums, concerts, and exhibitions. Key metrics, scope of work, and photos."},"section":{"title":"Cases","subtitle":"Completed projects with measurable results and production scope"},"videoOverlay":{"watch":"Watch video","manyTemplate":"{count} videos"},"emptyState":"No cases added yet","details":{"titleSuffix":"— case | Future Screen","servicesLabel":"Services:","videosLabel":"Video","contactPrompt":"Need more details?","contactLink":"Contact us","requestTitle":"Request a similar project","requestSubtitle":"Describe format and timeline, and we will propose a suitable setup","requestCta":"Discuss"}}$en$,
  true
)
ON CONFLICT (key) DO NOTHING;
