-- Ensure site_settings is canonicalized to id='default' and has star_border_settings.

ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS star_border_settings JSONB DEFAULT '{
  "enabled": false,
  "color": "#8aa2ff",
  "speed": 6,
  "thickness": 2.5,
  "intensity": 1,
  "cornerOffset": 0
}'::jsonb;

UPDATE public.site_settings
SET star_border_settings = '{
  "enabled": false,
  "color": "#8aa2ff",
  "speed": 6,
  "thickness": 2.5,
  "intensity": 1,
  "cornerOffset": 0
}'::jsonb || COALESCE(star_border_settings, '{}'::jsonb)
WHERE star_border_settings IS NULL
   OR jsonb_typeof(star_border_settings) <> 'object'
   OR NOT (star_border_settings ? 'cornerOffset');

INSERT INTO public.site_settings (id, background, background_settings, star_border_settings, updated_at)
SELECT
  'default',
  COALESCE(s.background, 'theme'),
  COALESCE(s.background_settings, '{}'::jsonb),
  '{
    "enabled": false,
    "color": "#8aa2ff",
    "speed": 6,
    "thickness": 2.5,
    "intensity": 1,
    "cornerOffset": 0
  }'::jsonb || COALESCE(s.star_border_settings, '{}'::jsonb),
  COALESCE(s.updated_at, NOW())
FROM public.site_settings s
WHERE s.id = 'global'
  AND NOT EXISTS (
    SELECT 1
    FROM public.site_settings d
    WHERE d.id = 'default'
  );

INSERT INTO public.site_settings (id, background, background_settings, star_border_settings, updated_at)
VALUES (
  'default',
  'theme',
  '{}'::jsonb,
  '{
    "enabled": false,
    "color": "#8aa2ff",
    "speed": 6,
    "thickness": 2.5,
    "intensity": 1,
    "cornerOffset": 0
  }'::jsonb,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

DELETE FROM public.site_settings
WHERE id = 'global';

COMMENT ON COLUMN public.site_settings.star_border_settings
IS 'Global StarBorder settings as JSON: enabled/color/speed/thickness/intensity/cornerOffset.';

