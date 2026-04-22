-- Seed home_cta_form into site_content. Mirrors
-- src/content/pages/home.ts#ctaForm. Submit button text + success
-- panel text are inline-editable on the homepage; placeholders and
-- validation errors are DB-backed but edited via admin UI.

INSERT INTO public.site_content (id, key, content, content_en, is_published)
VALUES (
  'home_cta_form',
  'home_cta_form',
  $ru${"errors":{"name":"Введите имя (минимум 2 символа)","contact":"Укажите телефон или email","phone":"Некорректный формат телефона","email":"Некорректный формат email","submit":"Ошибка отправки. Попробуйте позже или позвоните нам."},"success":{"title":"Заявка отправлена!","subtitle":"Мы свяжемся с вами в ближайшее время","reset":"Отправить ещё"},"placeholders":{"name":"Ваше имя","phone":"Телефон","email":"Email"},"submit":{"loading":"Отправка...","idle":"Обсудить"}}$ru$,
  $en${"errors":{"name":"Enter your name (at least 2 characters)","contact":"Enter phone or email","phone":"Invalid phone format","email":"Invalid email format","submit":"Submission failed. Please try again later or call us."},"success":{"title":"Request submitted!","subtitle":"We will contact you shortly","reset":"Send another request"},"placeholders":{"name":"Your name","phone":"Phone","email":"Email"},"submit":{"loading":"Sending...","idle":"Discuss"}}$en$,
  true
)
ON CONFLICT (key) DO NOTHING;
