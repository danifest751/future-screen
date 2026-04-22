-- Seed global_request_form into site_content. Mirrors
-- src/content/global.ts#requestFormContent so inline edits on any
-- RequestForm label have a DB row to upsert into.

INSERT INTO public.site_content (id, key, content, content_en, is_published)
VALUES (
  'global_request_form',
  'global_request_form',
  $ru${"defaults":{"title":"Запросить КП","ctaText":"Отправить"},"sourcePrefix":"Форма КП","validation":{"nameRequired":"Укажите имя","phoneRequired":"Укажите телефон","invalidEmail":"Некорректный email"},"submitError":"Не удалось отправить заявку. Проверьте соединение или попробуйте позже.","fields":{"emailLabel":"Email","emailPlaceholder":"example@mail.ru","nameLabel":"Имя*","namePlaceholder":"Имя","phoneLabel":"Телефон*","phonePlaceholder":"+7","moreFieldsShow":"Ещё поля","moreFieldsHide":"Скрыть дополнительные поля","telegramLabel":"Telegram","telegramPlaceholder":"@username","cityLabel":"Город","cityPlaceholder":"Екатеринбург","dateLabel":"Дата/период","datePlaceholder":"25–27 мая","formatLabel":"Формат","formatPlaceholder":"Форум, концерт, выставка...","commentLabel":"Комментарий","commentPlaceholder":"Кратко опишите задачу"},"submitPending":"Отправляем...","submitSuccess":"Спасибо! Мы свяжемся в течение 15 минут."}$ru$,
  $en${"defaults":{"title":"Request a quote","ctaText":"Send"},"sourcePrefix":"Quote form","validation":{"nameRequired":"Enter your name","phoneRequired":"Enter your phone number","invalidEmail":"Invalid email"},"submitError":"Could not submit the form. Check your connection and try again.","fields":{"emailLabel":"Email","emailPlaceholder":"example@mail.com","nameLabel":"Name*","namePlaceholder":"Name","phoneLabel":"Phone*","phonePlaceholder":"+1","moreFieldsShow":"More fields","moreFieldsHide":"Hide additional fields","telegramLabel":"Telegram","telegramPlaceholder":"@username","cityLabel":"City","cityPlaceholder":"Yekaterinburg","dateLabel":"Date/period","datePlaceholder":"May 25–27","formatLabel":"Event type","formatPlaceholder":"Forum, concert, expo...","commentLabel":"Comment","commentPlaceholder":"Briefly describe your task"},"submitPending":"Sending...","submitSuccess":"Thank you! We will contact you within 15 minutes."}$en$,
  true
)
ON CONFLICT (key) DO NOTHING;
