-- Seed page_prices into site_content. Mirrors src/content/pages/prices.ts.

INSERT INTO public.site_content (id, key, content, content_en, is_published)
VALUES (
  'page_prices',
  'page_prices',
  $ru${"seo":{"title":"Пакеты и цены | Фьючер Скрин","description":"Пакеты техсопровождения: Лайт, Медиум, Биг. Прозрачные цены на LED, звук, свет, сцены."},"hero":{"title":"Пакеты и ориентиры","subtitle":"Лайт · Медиум · Биг, подберите базовый комплект","loading":"Загрузка...","fallbackFormat":"Универсальный","optionsLabel":"Опции:","detailsLink":"Подробнее"},"pricing":{"title":"Как формируем цену","items":["Формат и длительность мероприятия","Площадка: зал/улица, габариты, подвес","Состав оборудования и резерв","Логистика и окна на монтаж/демонтаж"]},"form":{"title":"Получить ориентир","subtitle":"Опишите формат, вышлем примерные вилки","ctaText":"Запросить вилку"}}$ru$,
  $en${"seo":{"title":"Packages and Pricing | Future Screen","description":"Technical production packages: Lite, Medium, and Big. Transparent pricing for LED, sound, lighting, and stage."},"hero":{"title":"Packages and Price Ranges","subtitle":"Lite · Medium · Big — choose a baseline setup","loading":"Loading...","fallbackFormat":"Universal","optionsLabel":"Options:","detailsLink":"Details"},"pricing":{"title":"How we build pricing","items":["Event format and duration","Venue specifics: indoor/outdoor, dimensions, rigging","Equipment scope and backup level","Logistics and installation/dismantling windows"]},"form":{"title":"Get a rough estimate","subtitle":"Describe the event format and we will send expected ranges","ctaText":"Request estimate"}}$en$,
  true
)
ON CONFLICT (key) DO NOTHING;
