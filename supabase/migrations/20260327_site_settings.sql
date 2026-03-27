-- Таблица для глобальных настроек сайта (фон и т.д.)
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  background TEXT DEFAULT 'theme',
  background_settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Комментарии к полям
COMMENT ON TABLE site_settings IS 'Глобальные настройки сайта';
COMMENT ON COLUMN site_settings.background IS 'ID активного фона (theme, aurora, mesh и т.д.)';
COMMENT ON COLUMN site_settings.background_settings IS 'Настройки для каждого фона в формате JSON';

-- RLS (Row Level Security)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Чтение для всех (фон должен быть доступен всем посетителям)
CREATE POLICY "Public read site_settings" 
  ON site_settings 
  FOR SELECT 
  USING (true);

-- Изменение только для авторизованных (админ)
CREATE POLICY "Admin update site_settings" 
  ON site_settings 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Вставка только для авторизованных
CREATE POLICY "Admin insert site_settings" 
  ON site_settings 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Создаём начальную запись с дефолтными значениями
INSERT INTO site_settings (id, background, background_settings)
VALUES (
  'global',
  'theme',
  '{
    "aurora": {"motion": "normal", "intensity": 1, "contrast": 1, "color1": "#3A29FF", "color2": "#FF94B4", "color3": "#FF3232", "speed": 1, "blend": 0.5, "amplitude": 1},
    "mesh": {"motion": "normal", "intensity": 1, "contrast": 1, "gridOpacity": 0.08, "glow": 0.3},
    "dots": {"motion": "normal", "intensity": 1, "contrast": 1, "dotSize": 16, "gap": 32, "baseColor": "#5227FF", "activeColor": "#5227FF", "proximity": 150, "speedTrigger": 100, "shockRadius": 250, "shockStrength": 5, "maxSpeed": 5000, "resistance": 750, "returnDuration": 1.5},
    "waves": {"motion": "normal", "intensity": 1, "contrast": 1, "lineColor": "#FFFFFF", "backgroundColor": "#070112", "waveSpeedX": 0.0125, "waveSpeedY": 0.005, "waveAmpX": 32, "waveAmpY": 16, "xGap": 10, "yGap": 32, "friction": 0.925, "tension": 0.005, "maxCursorMove": 100},
    "rings": {"motion": "normal", "intensity": 1, "contrast": 1, "rings": 5, "spread": 1},
    "nebula": {"motion": "normal", "intensity": 1, "contrast": 1, "grain": 0.18, "hueShift": 0},
    "color-bends": {"motion": "normal", "intensity": 1, "contrast": 1, "color1": "#5227FF", "color2": "#FF7A00", "color3": "#00D1FF", "speed": 0.2, "rotation": 45, "autoRotate": 0, "scale": 1, "frequency": 1, "warpStrength": 1, "mouseInfluence": 1, "parallax": 0.5, "noise": 0.1},
    "pixel-blast": {"motion": "normal", "intensity": 1, "contrast": 1, "color": "#B19EEF", "pixelSize": 3, "patternScale": 2, "patternDensity": 1, "pixelJitter": 0, "rippleIntensity": 1, "rippleThickness": 0.1, "rippleSpeed": 0.3, "edgeFade": 0.5, "liquidStrength": 0.1, "liquidRadius": 1, "wobbleSpeed": 4.5},
    "line-waves": {"motion": "normal", "intensity": 1, "contrast": 1, "color1": "#FFFFFF", "color2": "#9AD0FF", "color3": "#FFD0F3", "speed": 0.3, "innerLineCount": 32, "outerLineCount": 36, "warpIntensity": 1, "rotation": -45, "edgeFadeWidth": 0, "colorCycleSpeed": 1, "brightness": 0.2, "mouseInfluence": 2},
    "galaxy": {"motion": "normal", "intensity": 1, "contrast": 1, "focalX": 0.5, "focalY": 0.5, "rotationX": 1, "rotationY": 0, "starSpeed": 0.5, "density": 1, "hueShift": 140, "speed": 1, "glowIntensity": 0.3, "saturation": 0, "repulsionStrength": 2, "twinkleIntensity": 0.3, "rotationSpeed": 0.1, "autoCenterRepulsion": 0}
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
