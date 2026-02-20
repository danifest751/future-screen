import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminFieldError from '../../components/admin/AdminFieldError';
import { useCalculatorConfig } from '../../hooks/useCalculatorConfig';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import type { CalculatorConfig } from '../../data/calculatorConfig';

const jsonArrayString = z
  .string()
  .min(2, 'Поле обязательно')
  .refine((value) => {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  }, 'Нужен валидный JSON-массив');

const schema = z.object({
  pitchOptionsJson: jsonArrayString,
  sizePresetsJson: jsonArrayString,
  screenProductsJson: jsonArrayString,
  assemblyCostPerM2: z.coerce.number().min(0),
  technicianPerDay: z.coerce.number().min(0),
  engineerPerDay: z.coerce.number().min(0),
  discountFactorsText: z.string().min(1, 'Укажите множители скидки'),
});

type FormValues = z.infer<typeof schema>;

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

const AdminCalculatorPage = () => {
  const { config, updateConfig, resetConfig } = useCalculatorConfig();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      pitchOptionsJson: pretty(config.pitchOptions),
      sizePresetsJson: pretty(config.sizePresets),
      screenProductsJson: pretty(config.screenProducts),
      assemblyCostPerM2: config.costParams.assemblyCostPerM2,
      technicianPerDay: config.costParams.technicianPerDay,
      engineerPerDay: config.costParams.engineerPerDay,
      discountFactorsText: config.costParams.discountFactors.join(', '),
    },
  });

  useEffect(() => {
    reset({
      pitchOptionsJson: pretty(config.pitchOptions),
      sizePresetsJson: pretty(config.sizePresets),
      screenProductsJson: pretty(config.screenProducts),
      assemblyCostPerM2: config.costParams.assemblyCostPerM2,
      technicianPerDay: config.costParams.technicianPerDay,
      engineerPerDay: config.costParams.engineerPerDay,
      discountFactorsText: config.costParams.discountFactors.join(', '),
    });
  }, [config, reset]);

  useUnsavedChangesGuard(isDirty);

  const onSubmit = (values: FormValues) => {
    try {
      const parsedPitch = JSON.parse(values.pitchOptionsJson);
      const parsedSizes = JSON.parse(values.sizePresetsJson);
      const parsedProducts = JSON.parse(values.screenProductsJson);

      const discountFactors = values.discountFactorsText
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n) && n > 0);

      if (!discountFactors.length) {
        toast.error('Некорректные discount factors');
        return;
      }

      const nextConfig: CalculatorConfig = {
        pitchOptions: parsedPitch,
        sizePresets: parsedSizes,
        screenProducts: parsedProducts,
        costParams: {
          assemblyCostPerM2: values.assemblyCostPerM2,
          technicianPerDay: values.technicianPerDay,
          engineerPerDay: values.engineerPerDay,
          discountFactors,
        },
      };

      updateConfig(nextConfig);
      toast.success('Конфигурация калькулятора сохранена');
    } catch {
      toast.error('Ошибка парсинга JSON-конфигурации');
    }
  };

  return (
    <AdminLayout title="Калькулятор" subtitle="Параметры, модели экранов и коэффициенты расчета">
      <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
        {isDirty && (
          <div className="mb-4 inline-flex rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
            Есть несохраненные изменения
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="text-sm text-slate-200">
              Pitch options (JSON array)
              <textarea rows={12} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs" {...register('pitchOptionsJson')} />
              <AdminFieldError message={errors.pitchOptionsJson?.message} />
            </label>

            <label className="text-sm text-slate-200">
              Size presets (JSON array)
              <textarea rows={12} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs" {...register('sizePresetsJson')} />
              <AdminFieldError message={errors.sizePresetsJson?.message} />
            </label>
          </div>

          <label className="text-sm text-slate-200">
            Screen products (JSON array)
            <textarea rows={14} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs" {...register('screenProductsJson')} />
            <AdminFieldError message={errors.screenProductsJson?.message} />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm text-slate-200">
              Монтаж за м²
              <input type="number" className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('assemblyCostPerM2')} />
            </label>
            <label className="text-sm text-slate-200">
              Техник/день
              <input type="number" className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('technicianPerDay')} />
            </label>
            <label className="text-sm text-slate-200">
              Инженер/день
              <input type="number" className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('engineerPerDay')} />
            </label>
          </div>

          <label className="text-sm text-slate-200">
            Discount factors (через запятую)
            <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('discountFactorsText')} />
            <AdminFieldError message={errors.discountFactorsText?.message} />
          </label>

          <div className="flex gap-3">
            <button type="submit" disabled={isSubmitting} className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-400 disabled:opacity-60">
              {isSubmitting ? 'Сохраняем...' : 'Сохранить конфигурацию'}
            </button>
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
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminCalculatorPage;
