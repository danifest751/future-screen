-- Seed page_contacts into site_content. Mirrors src/content/pages/contacts.ts.

INSERT INTO public.site_content (id, key, content, content_en, is_published)
VALUES (
  'page_contacts',
  'page_contacts',
  $ru${"seo":{"title":"Контакты | Фьючер Скрин","description":"Контакты Фьючер Скрин: телефон, email, адрес. Свяжитесь любым удобным способом."},"hero":{"title":"Контакты","subtitle":"Свяжитесь любым удобным способом"},"errors":{"loadTitle":"Не удалось загрузить контакты","emptyTitle":"Контакты не найдены","emptyDescription":"Обратитесь к администратору сайта"},"labels":{"phones":"Телефоны","email":"Email","address":"Адрес","workingHours":"Режим работы","mapTitle":"Карта","openInMaps":"Открыть в Яндекс.Картах"},"form":{"title":"Оставить заявку","subtitle":"Имя, телефон и кратко о задаче — ответим в течение 15 минут","ctaText":"Отправить"}}$ru$,
  $en${"seo":{"title":"Contacts | Future Screen","description":"Future Screen contacts: phone, email, and address. Reach us in any convenient way."},"hero":{"title":"Contacts","subtitle":"Get in touch in any convenient way"},"errors":{"loadTitle":"Failed to load contacts","emptyTitle":"Contacts not found","emptyDescription":"Please contact the site administrator"},"labels":{"phones":"Phones","email":"Email","address":"Address","workingHours":"Working hours","mapTitle":"Map","openInMaps":"Open in Yandex Maps"},"form":{"title":"Leave a request","subtitle":"Name, phone, and brief task description — we reply within 15 minutes","ctaText":"Send"}}$en$,
  true
)
ON CONFLICT (key) DO NOTHING;
