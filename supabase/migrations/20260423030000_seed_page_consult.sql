-- Seed page_consult into site_content. Mirrors src/content/pages/consult.ts.

INSERT INTO public.site_content (id, key, content, content_en, is_published)
VALUES (
  'page_consult',
  'page_consult',
  $ru${"seo":{"title":"Консультация по оборудованию | Фьючер Скрин","description":"Бесплатная консультация: подбор LED, звука, света, сцен под вашу площадку и формат мероприятия."},"hero":{"title":"Консультация","subtitle":"Подбор оборудования и схемы площадки"},"body":{"description":"Поможем выбрать LED, звук, свет, сцену или пакеты «под ключ». Рассчитаем покрытие, шаг пикселя, мощность звука, точки подвеса и резерв. Ответим за 15 минут.","items":["Разбор брифа: формат, площадка, сроки","Рекомендации по конфигурации и резерву","Карта точек питания, подвесов и кабель-менеджмента","КП и срок монтажа/демонтажа"]},"form":{"title":"Получить консультацию","subtitle":"Опишите задачу, ответим в течение 15 минут","ctaText":"Отправить"}}$ru$,
  $en${"seo":{"title":"Equipment Consultation | Future Screen","description":"Free consultation: LED, sound, lighting, and stage setup selection for your venue and event format."},"hero":{"title":"Consultation","subtitle":"Equipment and venue setup selection"},"body":{"description":"We help you choose LED, sound, lighting, stage, or turnkey packages. We calculate coverage, pixel pitch, sound power, rigging points, and backup options. Response in 15 minutes.","items":["Brief review: format, venue, timeline","Configuration and backup recommendations","Power, rigging, and cable management plan","Commercial proposal and installation/dismantling schedule"]},"form":{"title":"Get consultation","subtitle":"Describe your task, and we will respond within 15 minutes","ctaText":"Send"}}$en$,
  true
)
ON CONFLICT (key) DO NOTHING;
