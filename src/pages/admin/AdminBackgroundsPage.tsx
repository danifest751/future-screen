import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  BACKGROUND_CHANGED_EVENT,
  BACKGROUND_SETTINGS_CHANGED_EVENT,
  backgroundOptions,
  backgroundSettingsControls,
  defaultBackgroundSettingsById,
  getStoredBackground,
  getStoredBackgroundSettingsMap,
  patchStoredBackgroundSettings,
  setStoredBackground,
  setStoredBackgroundSettingsMap,
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
});

const customBackgroundOptions = backgroundOptions.filter(
  (option): option is { id: CustomBackgroundId; name: string; description: string } => option.id !== 'theme',
);

const AdminBackgroundsPage = () => {
  const [background, setBackground] = useState<BackgroundId>(() => getStoredBackground());
  const [settingsMap, setSettingsMap] = useState<BackgroundSettingsById>(() => getStoredBackgroundSettingsMap());

  useEffect(() => {
    const syncBackground = () => setBackground(getStoredBackground());
    const syncSettings = () => setSettingsMap(getStoredBackgroundSettingsMap());

    window.addEventListener('storage', syncBackground);
    window.addEventListener('storage', syncSettings);
    window.addEventListener(BACKGROUND_CHANGED_EVENT, syncBackground as EventListener);
    window.addEventListener(BACKGROUND_SETTINGS_CHANGED_EVENT, syncSettings as EventListener);

    return () => {
      window.removeEventListener('storage', syncBackground);
      window.removeEventListener('storage', syncSettings);
      window.removeEventListener(BACKGROUND_CHANGED_EVENT, syncBackground as EventListener);
      window.removeEventListener(BACKGROUND_SETTINGS_CHANGED_EVENT, syncSettings as EventListener);
    };
  }, []);

  const activeCustomBackground = useMemo(
    () => (background !== 'theme' ? background : null),
    [background],
  );

  const updateMotion = (backgroundId: CustomBackgroundId, motion: BackgroundMotion) => {
    setSettingsMap((prev) => ({
      ...prev,
      [backgroundId]: { ...prev[backgroundId], motion },
    }));
    patchStoredBackgroundSettings(backgroundId, { motion });
  };

  const updateNumericSetting = (backgroundId: CustomBackgroundId, key: string, value: number) => {
    const patch = { [key]: value } as Partial<AnyBackgroundSettings>;
    setSettingsMap((prev) => ({
      ...prev,
      [backgroundId]: {
        ...prev[backgroundId],
        [key]: value,
      },
    }));
    patchStoredBackgroundSettings(backgroundId, patch);
  };

  const updateColorSetting = (backgroundId: CustomBackgroundId, key: string, value: string) => {
    const patch = { [key]: value } as Partial<AnyBackgroundSettings>;
    setSettingsMap((prev) => ({
      ...prev,
      [backgroundId]: {
        ...prev[backgroundId],
        [key]: value,
      },
    }));
    patchStoredBackgroundSettings(backgroundId, patch);
  };

  const resetBackgroundSettings = (backgroundId: CustomBackgroundId) => {
    const nextMap = {
      ...settingsMap,
      [backgroundId]: { ...defaultBackgroundSettingsById[backgroundId] },
    };
    setSettingsMap(nextMap);
    setStoredBackgroundSettingsMap(nextMap);
  };

  const resetAllBackgroundSettings = () => {
    const defaults = cloneDefaultSettingsMap();
    setSettingsMap(defaults);
    setStoredBackgroundSettingsMap(defaults);
  };

  return (
    <AdminLayout title="Фоны" subtitle="Глобальный фон сайта и полные настройки для каждого пресета">
      <div className="space-y-6">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <h2 className="text-xl font-semibold text-white">Активный фон сайта</h2>
          <p className="mt-1 text-sm text-slate-400">
            Выбор применяется ко всему сайту. Настройки ниже сохранены отдельно для каждого фона.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,380px)_1fr]">
            <label className="text-sm text-slate-300">
              Текущий фон
              <select
                value={background}
                onChange={(e) => {
                  const nextBackground = e.target.value as BackgroundId;
                  setBackground(nextBackground);
                  setStoredBackground(nextBackground);
                }}
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
                      onClick={() => {
                        setBackground(option.id);
                        setStoredBackground(option.id);
                      }}
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
