-- Seed global_consent into site_content. Mirrors
-- src/content/global.ts#consentContent. Legal text that periodically
-- needs updates (compliance, policy wording) — editable without deploy.

INSERT INTO public.site_content (id, key, content, content_en, is_published)
VALUES (
  'global_consent',
  'global_consent',
  $ru${"prefix":"Нажимая кнопку «Отправить», я даю согласие на обработку персональных данных в соответствии с","linkLabel":"Политикой конфиденциальности"}$ru$,
  $en${"prefix":"By clicking “Send”, I agree to personal data processing in accordance with the","linkLabel":"Privacy Policy"}$en$,
  true
)
ON CONFLICT (key) DO NOTHING;
