import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Check, X, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/admin/ui/Button';
import Input from '../../components/admin/ui/Input';
import Field from '../../components/admin/ui/Field';
import ConfirmModal from '../../components/admin/ui/ConfirmModal';
import LoadingState from '../../components/admin/ui/LoadingState';
import {
  fetchAllPitchConfigs,
  upsertPitchConfig,
  deletePitchConfig,
  type DbPitchConfigRow,
} from '../../services/visualLedConfig';

const pitchSchema = z.object({
  pitch: z.string().min(1, 'Обязательно').regex(/^\d+(\.\d+)?$/, 'Только цифры, например 2.6'),
  label: z.string().min(1, 'Обязательно'),
  pixels_per_cabinet: z.coerce.number().int().min(1),
  cabinet_side_m: z.coerce.number().min(0.1).max(2),
  weight_min_kg: z.coerce.number().min(0),
  weight_max_kg: z.coerce.number().min(0),
  max_power_w: z.coerce.number().int().min(0),
  average_power_w: z.coerce.number().int().min(0),
  sort_order: z.coerce.number().int().min(0),
  is_active: z.boolean(),
});

type PitchForm = z.infer<typeof pitchSchema>;

// ── Row form (inline edit or new) ─────────────────────────────────────────────

interface RowFormProps {
  defaultValues: PitchForm;
  pitchLocked?: boolean;
  onSave: (data: PitchForm) => void;
  onCancel: () => void;
  loading: boolean;
}

const RowForm = ({ defaultValues, pitchLocked, onSave, onCancel, loading }: RowFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<PitchForm>({
    resolver: zodResolver(pitchSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4 rounded-xl border border-brand-500/30 bg-slate-900/60 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Pitch" error={errors.pitch?.message}>
          <Input
            {...register('pitch')}
            placeholder="2.6"
            disabled={pitchLocked}
            className={pitchLocked ? 'opacity-60' : ''}
          />
        </Field>
        <Field label="Метка" error={errors.label?.message}>
          <Input {...register('label')} placeholder="P2.6" />
        </Field>
        <Field label="px/кабинет" error={errors.pixels_per_cabinet?.message}>
          <Input {...register('pixels_per_cabinet')} type="number" min={1} />
        </Field>
        <Field label="Сторона кабинета (м)" error={errors.cabinet_side_m?.message}>
          <Input {...register('cabinet_side_m')} type="number" step="0.01" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Вес мин. (кг)" error={errors.weight_min_kg?.message}>
          <Input {...register('weight_min_kg')} type="number" step="0.1" />
        </Field>
        <Field label="Вес макс. (кг)" error={errors.weight_max_kg?.message}>
          <Input {...register('weight_max_kg')} type="number" step="0.1" />
        </Field>
        <Field label="Макс. мощн. (Вт)" error={errors.max_power_w?.message}>
          <Input {...register('max_power_w')} type="number" />
        </Field>
        <Field label="Ср. мощн. (Вт)" error={errors.average_power_w?.message}>
          <Input {...register('average_power_w')} type="number" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Порядок сортировки">
          <Input {...register('sort_order')} type="number" min={0} />
        </Field>
        <Field label="Активен">
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" {...register('is_active')} className="accent-brand-500" />
            Включён
          </label>
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
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const EMPTY_FORM: PitchForm = {
  pitch: '',
  label: '',
  pixels_per_cabinet: 192,
  cabinet_side_m: 0.5,
  weight_min_kg: 6,
  weight_max_kg: 8,
  max_power_w: 160,
  average_power_w: 55,
  sort_order: 0,
  is_active: true,
};

const AdminVisualLedPitchConfigPage = () => {
  const qc = useQueryClient();
  const [editPitch, setEditPitch] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin', 'vled-pitch-config'],
    queryFn: fetchAllPitchConfigs,
  });

  const saveMutation = useMutation({
    mutationFn: upsertPitchConfig,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'vled-pitch-config'] });
      void qc.invalidateQueries({ queryKey: ['visualLedConfig', 'pitchConfigs'] });
      toast.success('Сохранено');
      setEditPitch(null);
      setShowNew(false);
    },
    onError: () => toast.error('Ошибка сохранения'),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePitchConfig,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'vled-pitch-config'] });
      void qc.invalidateQueries({ queryKey: ['visualLedConfig', 'pitchConfigs'] });
      toast.success('Удалено');
      setConfirmDelete(null);
    },
    onError: () => toast.error('Ошибка удаления'),
  });

  const toForm = (row: DbPitchConfigRow): PitchForm => ({
    pitch: row.pitch,
    label: row.label,
    pixels_per_cabinet: row.pixels_per_cabinet,
    cabinet_side_m: Number(row.cabinet_side_m),
    weight_min_kg: Number(row.weight_min_kg),
    weight_max_kg: Number(row.weight_max_kg),
    max_power_w: row.max_power_w,
    average_power_w: row.average_power_w,
    sort_order: row.sort_order,
    is_active: row.is_active,
  });

  return (
    <AdminLayout
      title="Конфигурация pitch"
      subtitle="Спецификации кабинетов по типу пикселя — используются в визуализаторе и расчётах"
    >
      <div className="space-y-4">

        {/* Add new */}
        {!showNew && (
          <div className="flex justify-end">
            <Button leftIcon={<Plus size={14} />} onClick={() => { setShowNew(true); setEditPitch(null); }}>
              Добавить pitch
            </Button>
          </div>
        )}
        {showNew && (
          <RowForm
            defaultValues={EMPTY_FORM}
            onSave={(data) => saveMutation.mutate(data)}
            onCancel={() => setShowNew(false)}
            loading={saveMutation.isPending}
          />
        )}

        {/* Table */}
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="space-y-2">
            {rows.map((row) =>
              editPitch === row.pitch ? (
                <RowForm
                  key={row.pitch}
                  defaultValues={toForm(row)}
                  pitchLocked
                  onSave={(data) => saveMutation.mutate(data)}
                  onCancel={() => setEditPitch(null)}
                  loading={saveMutation.isPending}
                />
              ) : (
                <div
                  key={row.pitch}
                  className={`group flex flex-wrap items-center gap-4 rounded-xl border px-4 py-3 transition ${
                    row.is_active
                      ? 'border-white/10 bg-slate-800 hover:border-white/20'
                      : 'border-white/5 bg-slate-900/40 opacity-50'
                  }`}
                >
                  {/* Badge */}
                  <div className="flex items-center gap-2">
                    <Activity size={15} className="text-brand-400" />
                    <span className="w-16 font-mono text-sm font-semibold text-white">{row.label}</span>
                  </div>

                  {/* Specs grid */}
                  <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-slate-400 sm:grid-cols-4">
                    <span><span className="text-slate-500">px/каб </span>{row.pixels_per_cabinet}×{row.pixels_per_cabinet}</span>
                    <span><span className="text-slate-500">сторона </span>{row.cabinet_side_m} м</span>
                    <span><span className="text-slate-500">вес </span>{row.weight_min_kg}–{row.weight_max_kg} кг</span>
                    <span><span className="text-slate-500">мощн. </span>{row.average_power_w}/{row.max_power_w} Вт</span>
                  </div>

                  {/* Status */}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${row.is_active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                    {row.is_active ? 'активен' : 'выкл'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => { setEditPitch(row.pitch); setShowNew(false); }}
                      className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                      title="Редактировать"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(row.pitch)}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
                      title="Удалить"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete !== null}
        title={`Удалить pitch ${confirmDelete}?`}
        description="Спецификация будет удалена. Экраны с этим pitch перейдут на P2.6 по умолчанию."
        confirmText="Удалить"
        onConfirm={() => { if (confirmDelete) deleteMutation.mutate(confirmDelete); }}
        onCancel={() => setConfirmDelete(null)}
        danger
      />
    </AdminLayout>
  );
};

export default AdminVisualLedPitchConfigPage;
