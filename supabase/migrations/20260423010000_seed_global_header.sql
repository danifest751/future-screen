-- Seed global_header into site_content. Mirrors src/content/global.ts
-- so inline edits in the header have a DB row to upsert into.

INSERT INTO public.site_content (id, key, content, content_en, is_published)
VALUES (
  'global_header',
  'global_header',
  $ru${"navLinks":[{"to":"/#about","label":"О нас","hash":true},{"to":"/#equipment","label":"Оборудование","hash":true},{"to":"/#services","label":"Услуги","hash":true}],"rentLabel":"Аренда","casesLabel":"Кейсы","contactsLabel":"Контакты","signOutTitle":"Выйти","signInTitle":"Войти","menuAriaLabel":"Меню"}$ru$,
  $en${"navLinks":[{"to":"/#about","label":"About","hash":true},{"to":"/#equipment","label":"Equipment","hash":true},{"to":"/#services","label":"Services","hash":true}],"rentLabel":"Rental","casesLabel":"Cases","contactsLabel":"Contacts","signOutTitle":"Sign out","signInTitle":"Sign in","menuAriaLabel":"Menu"}$en$,
  true
)
ON CONFLICT (key) DO NOTHING;
