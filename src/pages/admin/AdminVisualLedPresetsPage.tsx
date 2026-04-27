import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Check, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/admin/ui/Button';
import Input from '../../components/admin/ui/Input';
import Field from '../../components/admin/ui/Field';
import LoadingState from '../../components/admin/ui/LoadingState';
import { MediaLibrary } from '../../components/admin/media';
import type { MediaItem } from '../../types/media';
import {
  fetchAllPresets,
  upsertPreset,
  type DbPresetRow,
} from '../../services/visualLedConfig';

// ── Form schema ───────────────────────────────────────────────────────────────

const presetSchema = z.object({
  name_ru: z.string().min(1, 'Обязательно'),
  name_en: z.string().min(1, 'Обязательно'),
  description_ru: z.string(),
  description_en: z.string(),
  area_m2: z.coerce.number().min(1),
  width_m: z.coerce.number().min(0.1),
  height_m: z.coerce.number().min(0.1),
  base_price: z.coerce.number().min(0),
  price_per_m2: z.coerce.number().min(0),
  event_multiplier: z.coerce.number().min(0.1).max(10),
  round_step: z.coerce.number().int().min(1),
  default_pitch: z.string().min(1),
  default_cabinet_side_m: z.coerce.number().min(0.1),
  sort_order: z.coerce.number().int().min(0),
  is_active: z.boolean(),
  preview_path: z.string().nullable(),
});

type PresetForm = z.infer<typeof presetSchema>;

// ── Inline preset edit form ───────────────────────────────────────────────────

interface PresetEditFormProps {
  row: DbPresetRow;
  onSave: (data: PresetForm) => void;
  onCancel: () => void;
  loading: boolean;
}

const PresetEditForm = ({ row, onSave, onCancel, loading }: PresetEditFormProps) => {
  const [mediaOpen, setMediaOpen] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PresetForm>({
    resolver: zodResolver(presetSchema),
    defaultValues: {
      name_ru: row.name_ru,
      name_en: row.name_en,
      description_ru: row.description_ru,
      description_en: row.description_en,
      area_m2: Number(row.area_m2),
      width_m: Number(row.width_m),
      height_m: Number(row.height_m),
      base_price: Number(row.base_price),
      price_per_m2: Number(row.price_per_m2),
      event_multiplier: Number(row.event_multiplier),
      round_step: Number(row.round_step),
      default_pitch: row.default_pitch,
      default_cabinet_side_m: Number(row.default_cabinet_side_m),
      sort_order: row.sort_order,
      is_active: row.is_active,
      preview_path: row.preview_path,
    },
  });

  const previewPath = watch('preview_path');
  const previewSrc = previewPath ?? `/visual-led-presets/${row.slug}.jpg`;

  const handleMediaSelect = (media: MediaItem) => {
    setValue('preview_path', media.public_url);
    setMediaOpen(false);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSave)}
        className="space-y-5 rounded-xl border border-brand-500/30 bg-slate-900/60 p-5"
      >
        {/* Preview */}
        <div className="flex items-start gap-4">
          <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-slate-950">
            <img src={previewSrc} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-300">Превью-изображение</div>
            <div className="text-[11px] text-slate-500">
              {previewPath ? previewPath : 'Встроенное (по умолчанию)'}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                leftIcon={<ImageIcon size={13} />}
                onClick={() => setMediaOpen(true)}
              >
                Из медиатеки
              </Button>
              {previewPath && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  leftIcon={<Trash2 size={13} />}
                  onClick={() => setValue('preview_path', null)}
                >
                  Сбросить
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Names */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Название (RU)" error={errors.name_ru?.message}>
            <Input {...register('name_ru')} />
          </Field>
          <Field label="Название (EN)" error={errors.name_en?.message}>
            <Input {...register('name_en')} />
          </Field>
          <Field label="Описание (RU)">
            <Input {...register('description_ru')} />
          </Field>
          <Field label="Описание (EN)">
            <Input {...register('description_en')} />
          </Field>
        </div>

        {/* Dimensions */}
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Размеры и площадь
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Площадь (м²)" error={errors.area_m2?.message}>
              <Input {...register('area_m2')} type="number" step="0.5" />
            </Field>
            <Field label="Ширина (м)" error={errors.width_m?.message}>
              <Input {...register('width_m')} type="number" step="0.5" />
            </Field>
            <Field label="Высота (м)" error={errors.height_m?.message}>
              <Input {...register('height_m')} type="number" step="0.5" />
            </Field>
            <Field label="Сторона кабинета (м)" error={errors.default_cabinet_side_m?.message}>
              <Input {...register('default_cabinet_side_m')} type="number" step="0.1" />
            </Field>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ценообразование
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Базовая цена (₽)" error={errors.base_price?.message}>
              <Input {...register('base_price')} type="number" step="1000" />
            </Field>
            <Field label="₽ / м²" error={errors.price_per_m2?.message}>
              <Input {...register('price_per_m2')} type="number" step="100" />
            </Field>
            <Field label="Мультипликатор" error={errors.event_multiplier?.message}>
              <Input {...register('event_multiplier')} type="number" step="0.05" />
            </Field>
            <Field label="Шаг округления" error={errors.round_step?.message}>
              <Input {...register('round_step')} type="number" step="1000" />
            </Field>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Формула: basePrice + area × pricePerM2 × eventMultiplier, округляется до roundStep
          </p>
        </div>

        {/* Pitch & meta */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Pitch по умолчанию" error={errors.default_pitch?.message}>
            <Input {...register('default_pitch')} placeholder="2.6" />
          </Field>
          <Field label="Порядок сортировки">
            <Input {...register('sort_order')} type="number" min={0} />
          </Field>
          <Field label="Активен">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <label className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="accent-brand-500"
                  />
                  Показывать
                </label>
              )}
            />
          </Field>
        </div>

        <div className="flex gap-2">
          <Button type="submit" loading={loading} leftIcon={<Check size={14} />}>
            Сохранить
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} leftIcon={<X size={14} />}>
            Отмена
          </Button>
        </div>
      </form>

      {/* Media picker modal */}
      {mediaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setMediaOpen(false)}>
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-white">Выберите изображение</span>
              <button
                type="button"
                onClick={() => setMediaOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <MediaLibrary onSelect={handleMediaSelect} />
          </div>
        </div>
      )}
    </>
  );
};

// ── Preset card (collapsed) ───────────────────────────────────────────────────

interface PresetCardProps {
  row: DbPresetRow;
  onEdit: () => void;
}

const PresetCard = ({ row, onEdit }: PresetCardProps) => {
  const previewSrc = row.preview_path ?? `/visual-led-presets/${row.slug}.jpg`;
  const priceEstimate = Math.round(
    Number(row.base_price) + Number(row.area_m2) * Number(row.price_per_m2) * Number(row.event_multiplier),
  );

  return (
    <div
      className={`group flex items-center gap-4 rounded-xl border px-4 py-3 transition ${
        row.is_active
          ? 'border-white/10 bg-slate-800 hover:border-white/20'
          : 'border-white/5 bg-slate-900/40 opacity-50'
      }`}
    >
      <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md border border-white/10 bg-slate-950">
        <img src={previewSrc} alt={row.name_ru} className="h-full w-full object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="font-semibold text-white">{row.name_ru}</span>
          <span className="text-xs text-slate-500">{row.name_en}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${row.is_active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
            {row.is_active ? 'активен' : 'выкл'}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400">
          <span>{Number(row.width_m)}×{Number(row.height_m)} м · {Number(row.area_m2)} м²</span>
          <span>pitch {row.default_pitch}</span>
          <span className="text-slate-300">от {priceEstimate.toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded p-1.5 text-slate-400 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
        title="Редактировать"
      >
        <Pencil size={15} />
      </button>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const AdminVisualLedPresetsPage = () => {
  const qc = useQueryClient();
  const [editSlug, setEditSlug] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin', 'vled-presets'],
    queryFn: fetchAllPresets,
  });

  const saveMutation = useMutation({
    mutationFn: (data: PresetForm & { slug: string }) => upsertPreset(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'vled-presets'] });
      void qc.invalidateQueries({ queryKey: ['visualLedConfig', 'presets'] });
      toast.success('Пресет сохранён');
      setEditSlug(null);
    },
    onError: () => toast.error('Ошибка сохранения'),
  });

  if (isLoading) return (
    <AdminLayout title="Пресеты визуализатора">
      <LoadingState />
    </AdminLayout>
  );

  return (
    <AdminLayout
      title="Пресеты визуализатора"
      subtitle="Типы событий, параметры ценообразования и превью для экрана выбора"
    >
      <div className="space-y-3">
        {rows.map((row) =>
          editSlug === row.slug ? (
            <PresetEditForm
              key={row.slug}
              row={row}
              onSave={(data) => saveMutation.mutate({ ...data, slug: row.slug })}
              onCancel={() => setEditSlug(null)}
              loading={saveMutation.isPending}
            />
          ) : (
            <PresetCard
              key={row.slug}
              row={row}
              onEdit={() => setEditSlug(row.slug)}
            />
          )
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminVisualLedPresetsPage;
