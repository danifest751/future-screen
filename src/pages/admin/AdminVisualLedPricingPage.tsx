import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Trash2, Check, X, Plus, Percent } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/admin/ui/Button';
import Input from '../../components/admin/ui/Input';
import Field from '../../components/admin/ui/Field';
import ConfirmModal from '../../components/admin/ui/ConfirmModal';
import LoadingState from '../../components/admin/ui/LoadingState';
import {
  fetchDayDiscounts,
  upsertDayDiscount,
  deleteDayDiscount,
  type DbDayDiscountRow,
} from '../../services/visualLedConfig';
import { FALLBACK_DAY_DISCOUNTS } from '../../lib/visualLed/pricing';

// ── Form schema ───────────────────────────────────────────────────────────────

const discountSchema = z.object({
  day_number: z.coerce.number().int().min(1, 'Минимум 1'),
  discount_percent: z.coerce.number().min(0).max(99, 'Максимум 99%'),
  label_ru: z.string().min(1, 'Обязательно'),
  is_last_tier: z.boolean(),
});

type DiscountForm = z.infer<typeof discountSchema>;

// ── Row form (inline edit / new) ──────────────────────────────────────────────

interface RowFormProps {
  defaultValues: DiscountForm;
  dayLocked?: boolean;
  onSave: (data: DiscountForm) => void;
  onCancel: () => void;
  loading: boolean;
}

const RowForm = ({ defaultValues, dayLocked, onSave, onCancel, loading }: RowFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<DiscountForm>({
    resolver: zodResolver(discountSchema),
    defaultValues,
  });

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="grid grid-cols-2 items-end gap-3 rounded-xl border border-brand-500/30 bg-slate-900/60 p-4 sm:grid-cols-4"
    >
      <Field label="День" error={errors.day_number?.message}>
        <Input
          {...register('day_number')}
          type="number"
          min={1}
          disabled={dayLocked}
          className={dayLocked ? 'opacity-60' : ''}
        />
      </Field>
      <Field label="Скидка (%)" error={errors.discount_percent?.message}>
        <Input {...register('discount_percent')} type="number" min={0} max={99} step={1} />
      </Field>
      <Field label="Метка" error={errors.label_ru?.message}>
        <Input {...register('label_ru')} placeholder="День 4+" />
      </Field>
      <Field label="Последний тир (N+ дней)">
        <label className="mt-2 flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" {...register('is_last_tier')} className="accent-brand-500" />
          Catch-all
        </label>
      </Field>

      <div className="col-span-2 flex gap-2 sm:col-span-4">
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

const EMPTY_FORM: DiscountForm = {
  day_number: 5,
  discount_percent: 40,
  label_ru: 'День 5+',
  is_last_tier: false,
};

const AdminVisualLedPricingPage = () => {
  const qc = useQueryClient();
  const [editDay, setEditDay] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin', 'vled-day-discounts'],
    queryFn: fetchDayDiscounts,
  });

  const saveMutation = useMutation({
    mutationFn: upsertDayDiscount,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'vled-day-discounts'] });
      void qc.invalidateQueries({ queryKey: ['visualLedConfig', 'dayDiscounts'] });
      toast.success('Сохранено');
      setEditDay(null);
      setShowNew(false);
    },
    onError: () => toast.error('Ошибка сохранения'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDayDiscount,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'vled-day-discounts'] });
      void qc.invalidateQueries({ queryKey: ['visualLedConfig', 'dayDiscounts'] });
      toast.success('Удалено');
      setConfirmDelete(null);
    },
    onError: () => toast.error('Ошибка удаления'),
  });

  const toForm = (row: DbDayDiscountRow): DiscountForm => ({
    day_number: row.day_number,
    discount_percent: Number(row.discount_percent),
    label_ru: row.label_ru,
    is_last_tier: row.is_last_tier,
  });

  // Live preview: what a client pays for N days at ₽100 000/день
  const previewBase = 100_000;
  const displayRows = rows.length > 0 ? rows : FALLBACK_DAY_DISCOUNTS.map((d) => ({
    day_number: d.dayNumber,
    discount_percent: d.discountPercent,
    label_ru: d.labelRu,
    is_last_tier: d.isLastTier,
    updated_at: '',
  }));

  return (
    <AdminLayout
      title="Скидки за количество дней"
      subtitle="Многодневная аренда — скидка применяется к каждому дню начиная с указанного"
    >
      <div className="space-y-6">

        {/* Discount table */}
        <div className="space-y-4">
          {!showNew && (
            <div className="flex justify-end">
              <Button
                leftIcon={<Plus size={14} />}
                onClick={() => { setShowNew(true); setEditDay(null); }}
              >
                Добавить тир
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

          {isLoading ? (
            <LoadingState />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3">День</th>
                    <th className="px-4 py-3">Скидка</th>
                    <th className="px-4 py-3">Метка</th>
                    <th className="px-4 py-3">Тип</th>
                    <th className="w-24 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((row) =>
                    editDay === row.day_number ? (
                      <tr key={row.day_number}>
                        <td colSpan={5} className="px-4 py-3">
                          <RowForm
                            defaultValues={toForm(row)}
                            dayLocked
                            onSave={(data) => saveMutation.mutate(data)}
                            onCancel={() => setEditDay(null)}
                            loading={saveMutation.isPending}
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr key={row.day_number} className="group bg-slate-950/30 transition hover:bg-slate-900/40">
                        <td className="px-4 py-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/15 text-xs font-bold text-brand-300">
                            {row.day_number}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-sm font-semibold text-white">
                            <Percent size={13} className="text-emerald-400" />
                            {Number(row.discount_percent) === 0
                              ? '—'
                              : `${row.discount_percent}%`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">{row.label_ru}</td>
                        <td className="px-4 py-3">
                          {row.is_last_tier ? (
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                              N+ дней
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-400">
                              точный
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => { setEditDay(row.day_number); setShowNew(false); }}
                              className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                              title="Редактировать"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(row.day_number)}
                              className="rounded p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
                              title="Удалить"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live preview */}
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Предпросмотр — аренда при базовой стоимости {previewBase.toLocaleString('ru-RU')} ₽/день
          </div>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5, 7].map((days) => {
              let total = 0;
              for (let d = 1; d <= days; d++) {
                const sorted = [...displayRows].sort((a, b) => a.day_number - b.day_number);
                const exact = sorted.find((r) => r.day_number === d);
                const lastTier = [...sorted].reverse().find((r) => r.is_last_tier);
                const discountPct = exact
                  ? Number(exact.discount_percent)
                  : lastTier && d >= lastTier.day_number
                    ? Number(lastTier.discount_percent)
                    : 0;
                total += previewBase * (1 - discountPct / 100);
              }
              const saving = previewBase * days - total;
              return (
                <div key={days} className="min-w-[120px] rounded-lg border border-white/10 bg-slate-800 px-3 py-2">
                  <div className="text-[11px] text-slate-400">{days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}</div>
                  <div className="mt-0.5 text-sm font-semibold text-white">
                    {Math.round(total).toLocaleString('ru-RU')} ₽
                  </div>
                  {saving > 0 && (
                    <div className="mt-0.5 text-[11px] text-emerald-400">
                      −{Math.round(saving).toLocaleString('ru-RU')} ₽
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete !== null}
        title={`Удалить тир «День ${confirmDelete}»?`}
        description="Строка скидки будет удалена. Это не затронет сохранённые заявки."
        confirmText="Удалить"
        onConfirm={() => { if (confirmDelete !== null) deleteMutation.mutate(confirmDelete); }}
        onCancel={() => setConfirmDelete(null)}
        danger
      />
    </AdminLayout>
  );
};

export default AdminVisualLedPricingPage;
