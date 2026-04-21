-- Seed home.hero bundled content into site_content so it can be edited inline.
--
-- The content matches the bundled src/content/pages/home.ts hero section
-- for both locales. Subsequent admin edits via useHomeHero overwrite the
-- row; the bundled fallback keeps first paint instant even before the
-- network round-trip returns.

INSERT INTO public.site_content (id, key, content, content_en, is_published)
VALUES (
  'home_hero',
  'home_hero',
  $ru$
{
  "badge": "Работаем по всей России с 2007 года",
  "titleLines": ["Аренда экранов,", "звука, света", "и сцены"],
  "subtitle": "Техническое обеспечение корпоративов, концертов, конференций и выставок любого масштаба",
  "primaryCta": "Рассчитать мероприятие",
  "secondaryCta": "Смотреть кейсы",
  "stats": [
    {"value": "18+", "label": "лет опыта"},
    {"value": "500+", "label": "мероприятий/год"},
    {"value": "300+", "label": "единиц техники"},
    {"value": "24/7", "label": "поддержка"}
  ]
}
  $ru$,
  $en$
{
  "badge": "Working across Russia since 2007",
  "titleLines": ["Screen,", "sound and lighting", "rental"],
  "subtitle": "Technical production for corporate events, concerts, conferences, and exhibitions of any scale",
  "primaryCta": "Estimate event",
  "secondaryCta": "View cases",
  "stats": [
    {"value": "18+", "label": "years of experience"},
    {"value": "500+", "label": "events/year"},
    {"value": "300+", "label": "equipment units"},
    {"value": "24/7", "label": "support"}
  ]
}
  $en$,
  true
)
ON CONFLICT (key) DO NOTHING;
