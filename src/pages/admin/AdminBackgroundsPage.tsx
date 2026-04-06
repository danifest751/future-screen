import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useSiteSettingsContext } from '../../context/SiteSettingsContext';
import { useI18n } from '../../context/I18nContext';
import { getAdminBackgroundsPageContent } from '../../content/pages/adminBackgrounds';
import {
  backgroundOptions,
  backgroundSettingsControls,
  defaultBackgroundSettingsById,
  defaultStarBorderSettings,
  type BackgroundId,
  type CustomBackgroundId,
  type BackgroundSettingsById,
  type StarBorderSettings,
  type AnyBackgroundSettings,
} from '../../lib/backgrounds';

const formatValue = (value: number, step: number) => {
  if (step >= 1) return value.toFixed(0);
  if (step >= 0.1) return value.toFixed(1);
  return value.toFixed(2);
};

const AdminBackgroundsPage = () => {
  const { adminLocale } = useI18n();
  const adminBackgroundsPageContent = getAdminBackgroundsPageContent(adminLocale);
  const { settings, loading, updateBackground, updateBackgroundSettings, updateStarBorder } = useSiteSettingsContext();

  const [selectedBg, setSelectedBg] = useState<BackgroundId>('theme');
  const [settingsMap, setSettingsMap] = useState<BackgroundSettingsById>(defaultBackgroundSettingsById);
  const [starBorder, setStarBorder] = useState<StarBorderSettings>(defaultStarBorderSettings);
  const [starBorderOpen, setStarBorderOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setSelectedBg(settings.background);
      setSettingsMap(settings.backgroundSettings);
      setStarBorder(settings.starBorder ?? defaultStarBorderSettings);
    }
  }, [settings, loading]);

  const withSaving = async (action: () => Promise<unknown>) => {
    setSaving(true);
    try {
      await action();
    } finally {
      setSaving(false);
    }
  };

  const handleBgChange = async (bg: BackgroundId) => {
    setSelectedBg(bg);
    await withSaving(async () => {
      await updateBackground(bg);
    });
  };

  const updateSetting = async (bgId: CustomBackgroundId, key: string, value: unknown) => {
    const newMap = { ...settingsMap, [bgId]: { ...settingsMap[bgId], [key]: value } };
    setSettingsMap(newMap);
    await withSaving(async () => {
      await updateBackgroundSettings(newMap);
    });
  };

  const resetBg = async (bgId: CustomBackgroundId) => {
    const newMap = { ...settingsMap, [bgId]: { ...defaultBackgroundSettingsById[bgId] } };
    setSettingsMap(newMap);
    await withSaving(async () => {
      await updateBackgroundSettings(newMap);
    });
  };

  const updateStarBorderSetting = async (key: keyof StarBorderSettings, value: unknown) => {
    const newSettings = { ...starBorder, [key]: value };
    setStarBorder(newSettings);
    await withSaving(async () => {
      await updateStarBorder(newSettings);
    });
  };

  if (loading) {
    return (
      <AdminLayout title={adminBackgroundsPageContent.title} subtitle={adminBackgroundsPageContent.loadingSubtitle}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  const currentSettings = selectedBg !== 'theme' ? settingsMap[selectedBg] : null;
  const controls = selectedBg !== 'theme' ? backgroundSettingsControls[selectedBg] : [];

  return (
    <AdminLayout title={adminBackgroundsPageContent.title} subtitle={adminBackgroundsPageContent.subtitle}>
      {saving && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-brand-500 px-3 py-1.5 text-sm text-white shadow-lg">
          {adminBackgroundsPageContent.saving}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-300">{adminBackgroundsPageContent.backgroundPickerTitle}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {backgroundOptions.map((bg) => (
              <button
                key={bg.id}
                onClick={() => handleBgChange(bg.id)}
                className={`rounded-lg border p-2.5 text-left transition ${
                  selectedBg === bg.id
                    ? 'border-brand-500 bg-brand-500/20'
                    : 'border-white/10 bg-slate-900 hover:border-white/30'
                }`}
              >
                <div className="text-xs font-medium text-slate-200">{bg.name}</div>
                <div className="mt-0.5 text-[10px] text-slate-500 line-clamp-1">{bg.description}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedBg !== 'theme' && currentSettings && (
          <div className="rounded-xl border border-white/10 bg-slate-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-300">
                {adminBackgroundsPageContent.settingsTitle}: {backgroundOptions.find((bg) => bg.id === selectedBg)?.name}
              </h3>
              <button
                onClick={() => resetBg(selectedBg)}
                className="rounded border border-white/20 px-2 py-1 text-xs text-slate-400 hover:text-white"
              >
                {adminBackgroundsPageContent.resetButton}
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-400">{adminBackgroundsPageContent.motionLabel}</span>
                <select
                  value={currentSettings.motion}
                  onChange={(e) => updateSetting(selectedBg, 'motion', e.target.value)}
                  className="w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
                >
                  <option value="slow">{adminBackgroundsPageContent.motionOptions.slow}</option>
                  <option value="normal">{adminBackgroundsPageContent.motionOptions.normal}</option>
                  <option value="fast">{adminBackgroundsPageContent.motionOptions.fast}</option>
                </select>
              </label>

              {controls.map((control) => {
                if (control.control === 'color') {
                  const value = String(currentSettings[control.key as keyof AnyBackgroundSettings] ?? '#FFFFFF');
                  return (
                    <label key={control.key} className="block">
                      <span className="mb-1 block text-xs text-slate-400">{control.label}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => updateSetting(selectedBg, control.key, e.target.value.toUpperCase())}
                          className="h-8 w-16 rounded border border-white/10 bg-slate-900"
                        />
                        <span className="text-xs text-slate-500">{value}</span>
                      </div>
                    </label>
                  );
                }

                const value = Number(currentSettings[control.key as keyof AnyBackgroundSettings]);
                return (
                  <label key={control.key} className="block">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{control.label}</span>
                      <span className="text-xs text-slate-500">{formatValue(value, control.step ?? 1)}</span>
                    </div>
                    <input
                      type="range"
                      min={control.min ?? 0}
                      max={control.max ?? 100}
                      step={control.step ?? 1}
                      value={value}
                      onChange={(e) => updateSetting(selectedBg, control.key, Number(e.target.value))}
                      className="w-full accent-brand-500"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-slate-800 p-4">
        <button
          onClick={() => setStarBorderOpen(!starBorderOpen)}
          className="flex w-full items-center justify-between"
        >
          <div className="text-left">
            <h3 className="text-sm font-medium text-slate-300">{adminBackgroundsPageContent.starBorderTitle}</h3>
            <p className="text-xs text-slate-500">{adminBackgroundsPageContent.starBorderSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${starBorder.enabled ? 'text-brand-400' : 'text-slate-500'}`}>
              {starBorder.enabled ? adminBackgroundsPageContent.starBorderOn : adminBackgroundsPageContent.starBorderOff}
            </span>
            <span className="text-slate-400">{starBorderOpen ? '^' : 'Ў'}</span>
          </div>
        </button>

        {starBorderOpen && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  const newSettings = { ...starBorder, enabled: !starBorder.enabled };
                  setStarBorder(newSettings);
                  await withSaving(async () => {
                    await updateStarBorder(newSettings);
                  });
                }}
                className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                  starBorder.enabled
                    ? 'bg-brand-500 text-white'
                    : 'border border-white/20 text-slate-400 hover:text-white'
                }`}
              >
                {starBorder.enabled
                  ? adminBackgroundsPageContent.starBorderDisable
                  : adminBackgroundsPageContent.starBorderEnable}
              </button>
            </div>

            {starBorder.enabled && (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">{adminBackgroundsPageContent.starBorderColor}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={starBorder.color}
                      onChange={(e) => updateStarBorderSetting('color', e.target.value.toUpperCase())}
                      className="h-8 w-16 rounded border border-white/10 bg-slate-900"
                    />
                    <span className="text-xs text-slate-500">{starBorder.color}</span>
                  </div>
                </label>

                {[
                  { key: 'speed', label: adminBackgroundsPageContent.starBorderSpeed, min: 1, max: 20, step: 0.5, suffix: 's' },
                  { key: 'thickness', label: adminBackgroundsPageContent.starBorderThickness, min: 1, max: 5, step: 0.5, suffix: 'px' },
                  { key: 'intensity', label: adminBackgroundsPageContent.starBorderGlow, min: 0.5, max: 3, step: 0.1, suffix: '' },
                ].map((control) => (
                  <label key={control.key} className="block">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{control.label}</span>
                      <span className="text-xs text-slate-500">
                        {starBorder[control.key as keyof StarBorderSettings]}
                        {control.suffix}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      value={starBorder[control.key as keyof StarBorderSettings] as number}
                      onChange={(e) => updateStarBorderSetting(control.key as keyof StarBorderSettings, Number(e.target.value))}
                      className="w-full accent-brand-500"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBackgroundsPage;

