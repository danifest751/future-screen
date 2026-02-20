import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminFieldError from '../../components/admin/AdminFieldError';
import { usePackages } from '../../hooks/usePackages';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import type { Package } from '../../data/packages';

const schema = z.object({
  id: z.string().min(1, 'ID обязателен'),
  name: z.string().min(2, 'Название обязательно'),
  forFormatsText: z.string().min(1, 'Укажите хотя бы 1 формат'),
  includesText: z.string().min(1, 'Укажите состав пакета'),
  optionsText: z.string().optional(),
  priceHint: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  id: '',
  name: '',
  forFormatsText: '',
  includesText: '',
  optionsText: '',
  priceHint: '',
};

const splitList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

const AdminPackagesPage = () => {
  const { packages, upsert, remove, resetToDefault } = usePackages();
  const [editingId, setEditingId] = useState<Package['id'] | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useUnsavedChangesGuard(isDirty);

  const onSubmit = async (values: FormValues) => {
    const payload: Package = {
      id: /^\d+$/.test(values.id) ? Number(values.id) : values.id,
      name: values.name.trim(),
      forFormats: splitList(values.forFormatsText),
      includes: splitList(values.includesText),
      options: values.optionsText ? splitList(values.optionsText) : [],
      priceHint: values.priceHint?.trim() || '',
    };

    const ok = await upsert(payload);
    if (!ok) {
      toast.error('Ошибка сохранения пакета');
      return;
    }

    toast.success(editingId ? 'Пакет обновлён' : 'Пакет добавлен');
    setEditingId(null);
    reset(defaultValues);
  };

  const startEdit = (item: Package) => {
    setEditingId(item.id);
    reset({
      id: String(item.id),
      name: item.name,
      forFormatsText: item.forFormats.join('\n'),
      includesText: item.includes.join('\n'),
      optionsText: (item.options ?? []).join('\n'),
      priceHint: item.priceHint ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    reset(defaultValues);
  };

  const sortedPackages = useMemo(() => [...packages], [packages]);

  return (
    <AdminLayout title="Пакеты" subtitle="Управление пакетами и ценовыми предложениями">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">{editingId ? 'Редактирование пакета' : 'Новый пакет'}</h2>
            {isDirty && (
              <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                Есть несохраненные изменения
              </span>
            )}
            {editingId && (
              <button type="button" onClick={cancelEdit} className="text-sm text-slate-300 hover:text-white">
                Отмена
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <label className="text-sm text-slate-200">
              ID*
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                disabled={Boolean(editingId)}
                {...register('id')}
              />
              <AdminFieldError message={errors.id?.message} />
            </label>

            <label className="text-sm text-slate-200">
              Название*
              <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('name')} />
              <AdminFieldError message={errors.name?.message} />
            </label>

            <label className="text-sm text-slate-200">
              Для форматов* (через запятую или новую строку)
              <textarea className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" rows={2} {...register('forFormatsText')} />
              <AdminFieldError message={errors.forFormatsText?.message} />
            </label>

            <label className="text-sm text-slate-200">
              Состав* (каждый пункт с новой строки)
              <textarea className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" rows={3} {...register('includesText')} />
              <AdminFieldError message={errors.includesText?.message} />
            </label>

            <label className="text-sm text-slate-200">
              Опции (необязательно)
              <textarea className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" rows={2} {...register('optionsText')} />
            </label>

            <label className="text-sm text-slate-200">
              Подсказка цены
              <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('priceHint')} />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-400 disabled:opacity-60"
            >
              {isSubmitting ? 'Сохраняем...' : editingId ? 'Сохранить' : 'Добавить'}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Список пакетов</h2>
            <button
              type="button"
              onClick={async () => {
                await resetToDefault();
                toast.success('Пакеты сброшены к дефолту');
              }}
              className="text-sm text-slate-300 hover:text-white"
            >
              Сброс к дефолту
            </button>
          </div>

          <div className="space-y-3">
            {sortedPackages.map((p) => (
              <div key={p.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{p.name}</div>
                    <div className="text-xs text-slate-400">ID: {p.id}</div>
                    <div className="mt-1 text-xs text-slate-300">Для: {p.forFormats.join(', ')}</div>
                    <div className="mt-1 text-xs text-slate-300">Состав: {p.includes.join(' · ')}</div>
                    {p.priceHint && <div className="mt-1 text-xs text-brand-100">{p.priceHint}</div>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="rounded border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-white/40"
                    >
                      Ред.
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Удалить пакет "${p.name}"?`)) return;
                        const ok = await remove(p.id);
                        if (ok) toast.success('Пакет удалён');
                        else toast.error('Ошибка удаления пакета');
                      }}
                      className="rounded border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 hover:border-red-400"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {sortedPackages.length === 0 && <div className="text-center text-slate-400">Пакетов пока нет</div>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPackagesPage;
