-- Add bilingual (ru/en) fields for rental categories content.
-- RU stays in existing columns, EN is stored in *_en columns.

ALTER TABLE public.rental_categories
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS short_name_en text,
  ADD COLUMN IF NOT EXISTS seo_en jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hero_en jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS about_en jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS use_cases_en jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS service_includes_en jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS benefits_en jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery_en jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faq_en jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS bottom_cta_en jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.rental_categories.name_en IS 'English localized name';
COMMENT ON COLUMN public.rental_categories.short_name_en IS 'English localized short name';
COMMENT ON COLUMN public.rental_categories.seo_en IS 'English localized SEO block';
COMMENT ON COLUMN public.rental_categories.hero_en IS 'English localized hero block';
COMMENT ON COLUMN public.rental_categories.about_en IS 'English localized about block';
COMMENT ON COLUMN public.rental_categories.use_cases_en IS 'English localized use cases';
COMMENT ON COLUMN public.rental_categories.service_includes_en IS 'English localized service includes';
COMMENT ON COLUMN public.rental_categories.benefits_en IS 'English localized benefits';
COMMENT ON COLUMN public.rental_categories.gallery_en IS 'English localized gallery';
COMMENT ON COLUMN public.rental_categories.faq_en IS 'English localized FAQ';
COMMENT ON COLUMN public.rental_categories.bottom_cta_en IS 'English localized bottom CTA';
