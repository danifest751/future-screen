-- Core DB i18n columns for public/admin content tables.

-- cases
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS city_en text,
  ADD COLUMN IF NOT EXISTS date_en text,
  ADD COLUMN IF NOT EXISTS format_en text,
  ADD COLUMN IF NOT EXISTS summary_en text,
  ADD COLUMN IF NOT EXISTS metrics_en text;

-- categories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS short_description_en text,
  ADD COLUMN IF NOT EXISTS bullets_en text[];

-- packages
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS for_formats_en text[],
  ADD COLUMN IF NOT EXISTS includes_en text[],
  ADD COLUMN IF NOT EXISTS options_en text[],
  ADD COLUMN IF NOT EXISTS price_hint_en text;

-- contacts
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS address_en text,
  ADD COLUMN IF NOT EXISTS working_hours_en text;

-- site_content (privacy and other managed pages)
ALTER TABLE public.site_content
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS content_en text,
  ADD COLUMN IF NOT EXISTS content_html_en text,
  ADD COLUMN IF NOT EXISTS meta_title_en text,
  ADD COLUMN IF NOT EXISTS meta_description_en text,
  ADD COLUMN IF NOT EXISTS font_size_en text;
