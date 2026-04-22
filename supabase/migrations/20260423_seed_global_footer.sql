-- Seed global_footer into site_content. Mirrors src/content/global.ts
-- so inline edits in the footer have a DB row to upsert into.

INSERT INTO public.site_content (id, key, content, content_en, is_published)
VALUES (
  'global_footer',
  'global_footer',
  $ru${"navLinks":[{"to":"/#about","label":"О нас"},{"to":"/#equipment","label":"Оборудование"},{"to":"/#services","label":"Услуги"},{"to":"/cases","label":"Кейсы"},{"to":"/#contacts","label":"Контакты"}],"rentLinks":[{"to":"/rent","label":"Вся аренда"},{"to":"/rent/video","label":"Видеоэкраны"},{"to":"/rent/sound","label":"Звук"},{"to":"/rent/light","label":"Свет"},{"to":"/rent/stage","label":"Сцены"},{"to":"/rent/instruments","label":"Инструменты"},{"to":"/visual-led","label":"▦ Визуализатор экрана"}],"description":"Техническое оснащение мероприятий любой сложности. LED-экраны, свет, звук, сцены.","legal":"ООО «Фьючер Скрин» · ИНН/КПП по запросу","navigationTitle":"Навигация","rentTitle":"Аренда","contactsTitle":"Контакты","location":"Екатеринбург, работаем по всей России","workHours":"Ежедневно: 9:00 — 22:00","supportHours":"Техподдержка: 24/7","copyright":"© 2007–2026 Фьючер Скрин. Все права защищены.","privacyPolicy":"Политика конфиденциальности","visualLedLink":"visual-led"}$ru$,
  $en${"navLinks":[{"to":"/#about","label":"About"},{"to":"/#equipment","label":"Equipment"},{"to":"/#services","label":"Services"},{"to":"/cases","label":"Cases"},{"to":"/#contacts","label":"Contacts"}],"rentLinks":[{"to":"/rent","label":"All rental"},{"to":"/rent/video","label":"Video screens"},{"to":"/rent/sound","label":"Sound"},{"to":"/rent/light","label":"Lighting"},{"to":"/rent/stage","label":"Stages"},{"to":"/rent/instruments","label":"Instruments"},{"to":"/visual-led","label":"▦ Screen visualizer"}],"description":"Technical event production of any scale. LED screens, lighting, sound, and stage solutions.","legal":"Future Screen LLC · Tax details on request","navigationTitle":"Navigation","rentTitle":"Rental","contactsTitle":"Contacts","location":"Yekaterinburg, working across Russia","workHours":"Daily: 9:00 — 22:00","supportHours":"Tech support: 24/7","copyright":"© 2007–2026 Future Screen. All rights reserved.","privacyPolicy":"Privacy policy","visualLedLink":"visual-led"}$en$,
  true
)
ON CONFLICT (key) DO NOTHING;
