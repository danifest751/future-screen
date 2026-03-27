import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button, ConfirmModal, EmptyState } from '../../components/admin/ui';
import { useCalculatorConfig } from '../../hooks/useCalculatorConfig';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import type {
  CalculatorConfig,
  PitchOption,
  ScreenSizePreset,
} from '../../data/calculatorConfig';

const asNumber = (value: string) => Number(value);

const toComparableConfig = (cfg: CalculatorConfig) => ({
  ...cfg,
  pitchOptions: cfg.pitchOptions.map((p) => ({
    ...p,
    maxDistance: Number.isFinite(p.maxDistance) ? p.maxDistance : 'Infinity',
  })),
});

const AdminCalculatorPage = () => {
  const { config, updateConfig, resetConfig } = useCalculatorConfig();
  const [pitchList, setPitchList] = useState<PitchOption[]>(config.pitchOptions);
  const [sizePresets, setSizePresets] = useState<ScreenSizePreset[]>(config.sizePresets);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  useEffect(() => {
    setPitchList(config.pitchOptions);
    setSizePresets(config.sizePresets);
  }, [config]);

  const hasUnsavedChanges = useMemo(() => {
    const currentComparable = JSON.stringify(
      toComparableConfig({
        pitchOptions: pitchList,
        sizePresets,
      })
    );

    const savedComparable = JSON.stringify(toComparableConfig(config));

    return currentComparable !== savedComparable;
  }, [config, pitchList, sizePresets]);

  useUnsavedChangesGuard(hasUnsavedChanges);

  const addPitch = () => {
    setPitchList((list) => [...list, { label: 'Новый шаг', value: 3.9, minDistance: 3, maxDistance: 6, description: '', stockArea: 0 }]);
  };

  const updatePitchField = (idx: number, field: keyof PitchOption, value: string) => {
    setPitchList((list) =>
      list.map((item, i) => {
        if (i !== idx) return item;
        if (field === 'label' || field === 'description') {
          return { ...item, [field]: value };
        }
        if (field === 'maxDistance') {
          return { ...item, maxDistance: value.trim() === '' ? Infinity : asNumber(value) };
        }
        return { ...item, [field]: asNumber(value) };
      })
    );
  };

  const removePitch = (idx: number) => {
    setPitchList((list) => list.filter((_, i) => i !== idx));
  };

  const addSizePreset = () => {
    setSizePresets((list) => [...list, { label: 'Новый размер', width: 4, height: 2.5 }]);
  };

  const updateSizeField = (idx: number, field: keyof ScreenSizePreset, value: string) => {
    setSizePresets((list) =>
      list.map((item, i) => {
        if (i !== idx) return item;
        return field === 'label' ? { ...item, label: value } : { ...item, [field]: asNumber(value) };
      })
    );
  };

  const removeSize = (idx: number) => {
    setSizePresets((list) => list.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!pitchList.length || !sizePresets.length) {
      toast.error('Добавьте хотя бы по одному элементу в каждый раздел');
      return;
    }

    const hasInvalidPitch = pitchList.some(
      (p) => !p.label.trim() || !Number.isFinite(p.value) || !Number.isFinite(p.minDistance) || !(Number.isFinite(p.maxDistance) || p.maxDistance === Infinity)
    );
    const hasInvalidSize = sizePresets.some((s) => !s.label.trim() || !Number.isFinite(s.width) || !Number.isFinite(s.height));

    if (hasInvalidPitch || hasInvalidSize) {
      toast.error('Проверьте заполнение полей: есть пустые или некорректные значения');
      return;
    }

    updateConfig({
      pitchOptions: pitchList,
      sizePresets,
    });

    toast.success('Конфигурация калькулятора сохранена');
  };

  const handleResetDefaults = () => {
    resetConfig();
    toast.success('Конфиг калькулятора сброшен');
  };

  return (
    <AdminLayout title="Калькулятор" subtitle="Параметры расчета экранов">
      <ConfirmModal
        open={resetModalOpen}
        danger
        title="Сбросить конфигурацию к дефолту?"
        description="Текущие несохраненные изменения будут потеряны."
        confirmText="Сбросить"
        cancelText="Отмена"
        onCancel={() => setResetModalOpen(false)}
        onConfirm={handleResetDefaults}
      />

      <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
        {hasUnsavedChanges && (
          <div className="mb-4 inline-flex rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
            Есть несохраненные изменения
          </div>
        )}

        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Шаги пикселя</div>
            <div className="mt-1 text-xl font-semibold text-white">{pitchList.length}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Типовые размеры</div>
            <div className="mt-1 text-xl font-semibold text-white">{sizePresets.length}</div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" size="md" onClick={addPitch}>
            Добавить шаг пикселя
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={addSizePreset}>
            Добавить типовой размер
          </Button>
          <div className="flex-1" />
          <Button type="button" variant="secondary" size="md" onClick={() => setResetModalOpen(true)}>
            Сбросить к дефолту
          </Button>
          <Button type="button" variant="primary" size="md" onClick={handleSave}>
            Сохранить конфигурацию
          </Button>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-lg font-semibold text-white">Шаги пикселя</div>
              {pitchList.map((pitch, idx) => (
                <div key={`${pitch.label}-${idx}`} className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm"
                      value={pitch.label}
                      onChange={(e) => updatePitchField(idx, 'label', e.target.value)}
                      placeholder="Например: P3.9"
                    />
                    <Button type="button" variant="danger" size="sm" onClick={() => removePitch(idx)}>
                      Удалить
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <label>
                      Значение (мм)
                      <input
                        type="number"
                        step="0.1"
                        className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                        value={pitch.value}
                        onChange={(e) => updatePitchField(idx, 'value', e.target.value)}
                      />
                    </label>
                    <label>
                      Min дистанция
                      <input
                        type="number"
                        step="0.1"
                        className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                        value={pitch.minDistance}
                        onChange={(e) => updatePitchField(idx, 'minDistance', e.target.value)}
                      />
                    </label>
                    <label>
                      Max дистанция
                      <input
                        type="number"
                        step="0.1"
                        className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                        value={pitch.maxDistance === Infinity ? '' : pitch.maxDistance}
                        onChange={(e) => updatePitchField(idx, 'maxDistance', e.target.value)}
                        placeholder="∞"
                      />
                    </label>
                    <label>
                      М² на складе
                      <input
                        type="number"
                        step="1"
                        className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                        value={pitch.stockArea ?? ''}
                        onChange={(e) => updatePitchField(idx, 'stockArea', e.target.value)}
                      />
                    </label>
                    <label className="col-span-2">
                      Описание
                      <input
                        className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                        value={pitch.description}
                        onChange={(e) => updatePitchField(idx, 'description', e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              ))}
              {pitchList.length === 0 && (
                <EmptyState
                  icon="📐"
                  title="Нет шагов пикселя"
                  description="Добавьте хотя бы один шаг пикселя для расчетов."
                />
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-lg font-semibold text-white">Типовые размеры</div>
              {sizePresets.map((size, idx) => (
                <div key={`${size.label}-${idx}`} className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm"
                      value={size.label}
                      onChange={(e) => updateSizeField(idx, 'label', e.target.value)}
                      placeholder="Название размера"
                    />
                    <Button type="button" variant="danger" size="sm" onClick={() => removeSize(idx)}>
                      Удалить
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <label>
                      Ширина (м)
                      <input
                        type="number"
                        step="0.1"
                        className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                        value={size.width}
                        onChange={(e) => updateSizeField(idx, 'width', e.target.value)}
                      />
                    </label>
                    <label>
                      Высота (м)
                      <input
                        type="number"
                        step="0.1"
                        className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                        value={size.height}
                        onChange={(e) => updateSizeField(idx, 'height', e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              ))}
              {sizePresets.length === 0 && (
                <EmptyState
                  icon="📏"
                  title="Нет типовых размеров"
                  description="Добавьте хотя бы один шаблон размера экрана."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCalculatorPage;
