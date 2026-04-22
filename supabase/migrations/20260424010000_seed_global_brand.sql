-- Seed global_brand into site_content. Mirrors src/content/global.ts#brandContent.
-- Changing phoneDisplay/phoneHref used to require a deploy; now editable.

INSERT INTO public.site_content (id, key, content, content_en, is_published)
VALUES (
  'global_brand',
  'global_brand',
  $ru${"namePrimary":"Фьючер","nameSecondary":"Скрин","subtitle":"Техсопровождение мероприятий","phoneDisplay":"8 (912) 246-65-66","phoneHref":"+79122466566"}$ru$,
  $en${"namePrimary":"Future","nameSecondary":"Screen","subtitle":"Event technical production","phoneDisplay":"+7 (912) 246-65-66","phoneHref":"+79122466566"}$en$,
  true
)
ON CONFLICT (key) DO NOTHING;
