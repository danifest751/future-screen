import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { useCalculatorConfig } from '../../hooks/useCalculatorConfig';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import type {
  CalculatorConfig,
  CostParams,
  Location,
  PitchOption,
  ScreenProduct,
  ScreenSizePreset,
} from '../../data/calculatorConfig';

const asNumber = (value: string) => Number(value);

const parseDiscountFactors = (value: string) =>
  value
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

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
  const [screenProducts, setScreenProducts] = useState<ScreenProduct[]>(config.screenProducts);
  const [costParams, setCostParams] = useState<CostParams>(config.costParams);
  const [discountFactorsText, setDiscountFactorsText] = useState(config.costParams.discountFactors.join(', '));

  useEffect(() => {
    setPitchList(config.pitchOptions);
    setSizePresets(config.sizePresets);
    setScreenProducts(config.screenProducts);
    setCostParams(config.costParams);
    setDiscountFactorsText(config.costParams.discountFactors.join(', '));
  }, [config]);

  const parsedDiscountFactors = useMemo(() => parseDiscountFactors(discountFactorsText), [discountFactorsText]);

  const hasUnsavedChanges = useMemo(() => {
    const currentComparable = JSON.stringify(
      toComparableConfig({
        pitchOptions: pitchList,
        sizePresets,
        screenProducts,
        costParams: {
          ...costParams,
          discountFactors: parsedDiscountFactors.length ? parsedDiscountFactors : costParams.discountFactors,
        },
      })
    );

    const savedComparable = JSON.stringify(toComparableConfig(config));
    const discountTextChanged = discountFactorsText.trim() !== config.costParams.discountFactors.join(', ');

    return currentComparable !== savedComparable || discountTextChanged;
  }, [config, costParams, discountFactorsText, parsedDiscountFactors, pitchList, screenProducts, sizePresets]);

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

  const addProduct = () => {
    setScreenProducts((list) => [
      ...list,
      {
        id: `product-${list.length + 1}`,
        label: 'Новый экран',
        location: 'indoor',
        pitch: 2.6,
        cabinetW: 0.5,
        cabinetH: 0.5,
        powerWPerM2: 700,
        pricePerM2: 6000,
        availableArea: 100,
      },
    ]);
  };

  const updateProductField = (idx: number, field: keyof ScreenProduct, value: string) => {
    setScreenProducts((list) =>
      list.map((item, i) => {
        if (i !== idx) return item;
        if (field === 'id' || field === 'label') return { ...item, [field]: value };
        if (field === 'location') return { ...item, location: value as Location };
        if (field === 'availableArea') return { ...item, availableArea: value.trim() === '' ? undefined : asNumber(value) };
        return { ...item, [field]: asNumber(value) };
      })
    );
  };

  const removeProduct = (idx: number) => {
    setScreenProducts((list) => list.filter((_, i) => i !== idx));
  };

  const updateCostField = (field: Exclude<keyof CostParams, 'discountFactors'>, value: string) => {
    setCostParams((prev) => ({ ...prev, [field]: asNumber(value) }));
  };

  const handleSave = () => {
    if (!pitchList.length || !sizePresets.length || !screenProducts.length) {
      toast.error('Добавьте хотя бы по одному элементу в каждый раздел');
      return;
    }

    if (!parsedDiscountFactors.length) {
      toast.error('Укажите корректные множители скидки (например: 1, 0.5, 0.4)');
      return;
    }

    const hasInvalidPitch = pitchList.some(
      (p) => !p.label.trim() || !Number.isFinite(p.value) || !Number.isFinite(p.minDistance) || !(Number.isFinite(p.maxDistance) || p.maxDistance === Infinity)
    );
    const hasInvalidSize = sizePresets.some((s) => !s.label.trim() || !Number.isFinite(s.width) || !Number.isFinite(s.height));
    const hasInvalidProduct = screenProducts.some(
      (p) =>
        !p.id.trim() ||
        !p.label.trim() ||
        !Number.isFinite(p.pitch) ||
        !Number.isFinite(p.cabinetW) ||
        !Number.isFinite(p.cabinetH) ||
        !Number.isFinite(p.powerWPerM2) ||
        !Number.isFinite(p.pricePerM2) ||
        (p.availableArea !== undefined && !Number.isFinite(p.availableArea))
    );
    const hasInvalidCosts =
      !Number.isFinite(costParams.assemblyCostPerM2) ||
      !Number.isFinite(costParams.technicianPerDay) ||
      !Number.isFinite(costParams.engineerPerDay);

    if (hasInvalidPitch || hasInvalidSize || hasInvalidProduct || hasInvalidCosts) {
      toast.error('Проверьте заполнение полей: есть пустые или некорректные значения');
      return;
    }

    updateConfig({
      pitchOptions: pitchList,
      sizePresets,
      screenProducts,
      costParams: {
        ...costParams,
        discountFactors: parsedDiscountFactors,
      },
    });

    toast.success('Конфигурация калькулятора сохранена');
  };

  return (
    <AdminLayout title="Калькулятор" subtitle="Параметры, модели экранов и коэффициенты расчета">
      <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
        {hasUnsavedChanges && (
          <div className="mb-4 inline-flex rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
            Есть несохраненные изменения
          </div>
        )}

        <div className="mb-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Шаги пикселя</div>
            <div className="mt-1 text-xl font-semibold text-white">{pitchList.length}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Типовые размеры</div>
            <div className="mt-1 text-xl font-semibold text-white">{sizePresets.length}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Модели экранов</div>
            <div className="mt-1 text-xl font-semibold text-white">{screenProducts.length}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Discount factors</div>
            <div className="mt-1 text-sm text-slate-200">{discountFactorsText || '—'}</div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addPitch}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:border-white/30"
          >
            Добавить шаг пикселя
          </button>
          <button
            type="button"
            onClick={addSizePreset}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:border-white/30"
          >
            Добавить типовой размер
          </button>
          <button
            type="button"
            onClick={addProduct}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:border-white/30"
          >
            Добавить модель экрана
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => {
              resetConfig();
              toast.success('Конфиг калькулятора сброшен');
            }}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-white/40"
          >
            Сбросить к дефолту
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-400"
          >
            Сохранить конфигурацию
          </button>
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
                    <button type="button" onClick={() => removePitch(idx)} className="text-xs text-red-300 hover:text-red-200">
                      Удалить
                    </button>
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
              {pitchList.length === 0 && <div className="text-sm text-slate-400">Пусто. Добавьте шаг пикселя.</div>}
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
                    <button type="button" onClick={() => removeSize(idx)} className="text-xs text-red-300 hover:text-red-200">
                      Удалить
                    </button>
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
              {sizePresets.length === 0 && <div className="text-sm text-slate-400">Пусто. Добавьте размер.</div>}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-lg font-semibold text-white">Модели экранов</div>
            {screenProducts.map((product, idx) => (
              <div key={`${product.id}-${idx}`} className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
                <div className="mb-2 grid gap-2 md:grid-cols-3">
                  <label className="text-xs text-slate-300">
                    ID
                    <input
                      className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                      value={product.id}
                      onChange={(e) => updateProductField(idx, 'id', e.target.value)}
                    />
                  </label>
                  <label className="text-xs text-slate-300 md:col-span-2">
                    Название
                    <input
                      className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                      value={product.label}
                      onChange={(e) => updateProductField(idx, 'label', e.target.value)}
                    />
                  </label>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-xs text-slate-300">
                    Локация
                    <select
                      className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                      value={product.location}
                      onChange={(e) => updateProductField(idx, 'location', e.target.value)}
                    >
                      <option value="indoor">indoor</option>
                      <option value="outdoor">outdoor</option>
                    </select>
                  </label>
                  <label className="text-xs text-slate-300">
                    Pitch (мм)
                    <input
                      type="number"
                      step="0.1"
                      className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                      value={product.pitch}
                      onChange={(e) => updateProductField(idx, 'pitch', e.target.value)}
                    />
                  </label>
                  <label className="text-xs text-slate-300">
                    Кабинет W (м)
                    <input
                      type="number"
                      step="0.1"
                      className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                      value={product.cabinetW}
                      onChange={(e) => updateProductField(idx, 'cabinetW', e.target.value)}
                    />
                  </label>
                  <label className="text-xs text-slate-300">
                    Кабинет H (м)
                    <input
                      type="number"
                      step="0.1"
                      className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                      value={product.cabinetH}
                      onChange={(e) => updateProductField(idx, 'cabinetH', e.target.value)}
                    />
                  </label>
                  <label className="text-xs text-slate-300">
                    Потребление (W/м²)
                    <input
                      type="number"
                      step="1"
                      className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                      value={product.powerWPerM2}
                      onChange={(e) => updateProductField(idx, 'powerWPerM2', e.target.value)}
                    />
                  </label>
                  <label className="text-xs text-slate-300">
                    Цена за м²
                    <input
                      type="number"
                      step="1"
                      className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                      value={product.pricePerM2}
                      onChange={(e) => updateProductField(idx, 'pricePerM2', e.target.value)}
                    />
                  </label>
                  <label className="text-xs text-slate-300">
                    Доступно, м²
                    <input
                      type="number"
                      step="1"
                      className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                      value={product.availableArea ?? ''}
                      onChange={(e) => updateProductField(idx, 'availableArea', e.target.value)}
                    />
                  </label>
                </div>
                <div className="mt-2">
                  <button type="button" onClick={() => removeProduct(idx)} className="text-xs text-red-300 hover:text-red-200">
                    Удалить модель
                  </button>
                </div>
              </div>
            ))}
            {screenProducts.length === 0 && <div className="text-sm text-slate-400">Пусто. Добавьте модель экрана.</div>}
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-lg font-semibold text-white">Параметры стоимости</div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm text-slate-200">
                Монтаж за м²
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={costParams.assemblyCostPerM2}
                  onChange={(e) => updateCostField('assemblyCostPerM2', e.target.value)}
                />
              </label>
              <label className="text-sm text-slate-200">
                Техник/день
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={costParams.technicianPerDay}
                  onChange={(e) => updateCostField('technicianPerDay', e.target.value)}
                />
              </label>
              <label className="text-sm text-slate-200">
                Инженер/день
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={costParams.engineerPerDay}
                  onChange={(e) => updateCostField('engineerPerDay', e.target.value)}
                />
              </label>
            </div>

            <label className="mt-3 block text-sm text-slate-200">
              Discount factors (через запятую)
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                value={discountFactorsText}
                onChange={(e) => setDiscountFactorsText(e.target.value)}
                placeholder="1, 0.5, 0.4"
              />
            </label>

            {!parsedDiscountFactors.length && (
              <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-300">
                Укажите хотя бы один положительный множитель (пример: 1, 0.5, 0.4)
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCalculatorPage;
