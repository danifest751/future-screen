import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useSiteSettingsContext } from '../../context/SiteSettingsContext';
import {
  backgroundOptions,
  backgroundSettingsControls,
  defaultBackgroundSettingsById,
  type AnyBackgroundSettings,
  type BackgroundId,
  type BackgroundMotion,
  type BackgroundSettingsById,
  type CustomBackgroundId,
} from '../../lib/backgrounds';

const formatValue = (value: number, step: number) => {
  if (step >= 1) return value.toFixed(0);
  if (step >= 0.1) return value.toFixed(1);
  return value.toFixed(2);
};

const cloneDefaultSettingsMap = (): BackgroundSettingsById => ({
  aurora: { ...defaultBackgroundSettingsById.aurora },
  mesh: { ...defaultBackgroundSettingsById.mesh },
  dots: { ...defaultBackgroundSettingsById.dots },
  waves: { ...defaultBackgroundSettingsById.waves },
  rings: { ...defaultBackgroundSettingsById.rings },
  nebula: { ...defaultBackgroundSettingsById.nebula },
  'color-bends': { ...defaultBackgroundSettingsById['color-bends'] },
  'pixel-blast': { ...defaultBackgroundSettingsById['pixel-blast'] },
  'line-waves': { ...defaultBackgroundSettingsById['line-waves'] },
  galaxy: { ...defaultBackgroundSettingsById.galaxy },
});

const customBackgroundOptions = backgroundOptions.filter(
  (option): option is { id: CustomBackgroundId; name: string; description: string } => option.id !== 'theme',
);

const AdminBackgroundsPage = () => {
  const { settings, loading, error, updateBackground, updateBackgroundSettings } = useSiteSettingsContext();
  
  // Локальное состояние для UI
  const [background, setBackground] = useState<BackgroundId>('theme');
  const [settingsMap, setSettingsMap] = useState<BackgroundSettingsById>(() => cloneDefaultSettingsMap());
  const [saving, setSaving] = useState(false);

  // Синхронизация с загруженными настройками
  useEffect(() => {
    if (!loading) {
      setBackground(settings.background);
      setSettingsMap(settings.backgroundSettings);
    }
  }, [settings, loading]);

  const activeCustomBackground = useMemo(
    () => (background !== 'theme' ? background : null),
    [background],
  );

  const updateMotion = async (backgroundId: CustomBackgroundId, motion: BackgroundMotion) => {
    const newSettingsMap = {
      ...settingsMap,
      [backgroundId]: { ...settingsMap[backgroundId], motion },
    };
    setSettingsMap(newSettingsMap);
    
    setSaving(true);
    await updateBackgroundSettings(newSettingsMap);
    setSaving(false);
  };

  const updateNumericSetting = async (backgroundId: CustomBackgroundId, key: string, value: number) => {
    const patch = { [key]: value } as Partial<AnyBackgroundSettings>;
    const newSettingsMap = {
      ...settingsMap,
      [backgroundId]: {
        ...settingsMap[backgroundId],
        [key]: value,
      },
    };
    setSettingsMap(newSettingsMap);
    
    setSaving(true);
    await updateBackgroundSettings(newSettingsMap);
    setSaving(false);
  };

  const updateColorSetting = async (backgroundId: CustomBackgroundId, key: string, value: string) => {
    const newSettingsMap = {
      ...settingsMap,
      [backgroundId]: {
        ...settingsMap[backgroundId],
        [key]: value,
      },
    };
    setSettingsMap(newSettingsMap);
    
    setSaving(true);
    await updateBackgroundSettings(newSettingsMap);
    setSaving(false);
  };

  const resetBackgroundSettings = async (backgroundId: CustomBackgroundId) => {
    const nextMap = {
      ...settingsMap,
      [backgroundId]: { ...defaultBackgroundSettingsById[backgroundId] },
    };
    setSettingsMap(nextMap);
    
    setSaving(true);
    await updateBackgroundSettings(nextMap);
    setSaving(false);
  };

  const resetAllBackgroundSettings = async () => {
    const defaults = cloneDefaultSettingsMap();
    setSettingsMap(defaults);
    
    setSaving(true);
    await updateBackgroundSettings(defaults);
    setSaving(false);
  };

  const handleBackgroundChange = async (newBackground: BackgroundId) => {
    setBackground(newBackground);
    
    setSaving(true);
    await updateBackground(newBackground);
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout title="Фоны" subtitle="Глобальный фон сайта">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Фоны" subtitle="Глобальный фон сайта">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
          <h3 className="text-lg font-semibold text-red-400">Ошибка загрузки</h3>
          <p className="mt-2 text-sm text-red-300">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Фоны" subtitle="Глобальный фон сайта и полные настройки для каждого пресета">
      {saving && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-brand-500 px-4 py-2 text-sm text-white shadow-lg">
          Сохранение...
        </div>
      )}
      
      <div className="space-y-6">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <h2 className="text-xl font-semibold text-white">Активный фон сайта</h2>
          <p className="mt-1 text-sm text-slate-400">
            Выбор применяется ко всему сайту в реальном времени. Все посетители увидят изменения.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,380px)_1fr]">
            <label className="text-sm text-slate-300">
              Текущий фон
              <select
                value={background}
                onChange={(e) => handleBackgroundChange(e.target.value as BackgroundId)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand-400"
              >
                {backgroundOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end justify-start md:justify-end">
              <button
                type="button"
                onClick={resetAllBackgroundSettings}
                className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/40 hover:text-white"
              >
                Сбросить все настройки фонов
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {customBackgroundOptions.map((option) => {
            const isActive = activeCustomBackground === option.id;
            const settings = settingsMap[option.id];

            return (
              <section
                key={option.id}
                className={`rounded-xl border p-5 ${
                  isActive
                    ? 'border-brand-500/50 bg-brand-500/10'
                    : 'border-white/10 bg-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{option.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{option.description}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleBackgroundChange(option.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        isActive
                          ? 'bg-brand-500 text-white'
                          : 'border border-white/20 text-slate-200 hover:border-white/40 hover:text-white'
                      }`}
                    >
                      {isActive ? 'Активен' : 'Сделать активным'}
                    </button>
                    <button
                      type="button"
                      onClick={() => resetBackgroundSettings(option.id)}
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/40 hover:text-white"
                    >
                      Сбросить
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="block text-sm text-slate-300">
                    Анимация
                    <select
                      value={settings.motion}
                      onChange={(e) => updateMotion(option.id, e.target.value as BackgroundMotion)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand-400"
                    >
                      <option value="slow">Медленно</option>
                      <option value="normal">Нормально</option>
                      <option value="fast">Быстро</option>
                    </select>
                  </label>

                  {backgroundSettingsControls[option.id].map((control) => {
                    if (control.control === 'color') {
                      const value = String(settings[control.key as keyof AnyBackgroundSettings] ?? '#FFFFFF');
                      return (
                        <label key={control.key} className="block text-sm text-slate-300">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span>{control.label}</span>
                            <span className="text-xs text-slate-400">{value}</span>
                          </div>
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => updateColorSetting(option.id, control.key, e.target.value.toUpperCase())}
                            className="h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-slate-900 px-1 py-1"
                          />
                        </label>
                      );
                    }

                    const step = control.step ?? 1;
                    const min = control.min ?? 0;
                    const max = control.max ?? 100;
                    const value = Number(settings[control.key as keyof AnyBackgroundSettings]);
                    return (
                      <label key={control.key} className="block text-sm text-slate-300">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span>{control.label}</span>
                          <span className="text-xs text-slate-400">{formatValue(value, step)}</span>
                        </div>
                        <input
                          type="range"
                          min={min}
                          max={max}
                          step={step}
                          value={value}
                          onChange={(e) => updateNumericSetting(option.id, control.key, Number(e.target.value))}
                          className="w-full accent-brand-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBackgroundsPage;
