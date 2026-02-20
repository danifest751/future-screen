import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminFieldError from '../../components/admin/AdminFieldError';
import { useCategories } from '../../hooks/useCategories';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import type { Category } from '../../data/categories';

const schema = z.object({
  id: z.string().min(1, 'ID обязателен'),
  title: z.string().min(2, 'Название обязательно'),
  shortDescription: z.string().min(5, 'Добавьте краткое описание'),
  bulletsText: z.string().min(2, 'Добавьте преимущества'),
  pagePath: z.string().min(2, 'Путь обязателен').regex(/^\//, 'Путь должен начинаться с /'),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  id: '',
  title: '',
  shortDescription: '',
  bulletsText: '',
  pagePath: '/rent/',
};

const splitList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

const AdminCategoriesPage = () => {
  const { categories, upsert, remove, resetToDefault } = useCategories();
  const [editingId, setEditingId] = useState<Category['id'] | null>(null);

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
    const payload: Category = {
      id: /^\d+$/.test(values.id) ? Number(values.id) : values.id,
      title: values.title.trim(),
      shortDescription: values.shortDescription.trim(),
      bullets: splitList(values.bulletsText),
      pagePath: values.pagePath.trim(),
    };

    const ok = await upsert(payload);
    if (!ok) {
      toast.error('Ошибка сохранения категории');
      return;
    }

    toast.success(editingId ? 'Категория обновлена' : 'Категория добавлена');
    setEditingId(null);
    reset(defaultValues);
  };

  const startEdit = (item: Category) => {
    setEditingId(item.id);
    reset({
      id: String(item.id),
      title: item.title,
      shortDescription: item.shortDescription,
      bulletsText: item.bullets.join('\n'),
      pagePath: item.pagePath,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    reset(defaultValues);
  };

  const sortedCategories = useMemo(() => [...categories], [categories]);

  return (
    <AdminLayout title="Категории" subtitle="Управление категориями аренды">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">{editingId ? 'Редактирование категории' : 'Новая категория'}</h2>
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
              <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" disabled={Boolean(editingId)} {...register('id')} />
              <AdminFieldError message={errors.id?.message} />
            </label>

            <label className="text-sm text-slate-200">
              Название*
              <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('title')} />
              <AdminFieldError message={errors.title?.message} />
            </label>

            <label className="text-sm text-slate-200">
              Краткое описание*
              <textarea className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" rows={2} {...register('shortDescription')} />
              <AdminFieldError message={errors.shortDescription?.message} />
            </label>

            <label className="text-sm text-slate-200">
              Буллеты* (каждый с новой строки)
              <textarea className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" rows={3} {...register('bulletsText')} />
              <AdminFieldError message={errors.bulletsText?.message} />
            </label>

            <label className="text-sm text-slate-200">
              Путь страницы*
              <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('pagePath')} />
              <AdminFieldError message={errors.pagePath?.message} />
            </label>

            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-400 disabled:opacity-60">
              {isSubmitting ? 'Сохраняем...' : editingId ? 'Сохранить' : 'Добавить'}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Список категорий</h2>
            <button
              type="button"
              onClick={async () => {
                await resetToDefault();
                toast.success('Категории сброшены к дефолту');
              }}
              className="text-sm text-slate-300 hover:text-white"
            >
              Сброс к дефолту
            </button>
          </div>

          <div className="space-y-3">
            {sortedCategories.map((c) => (
              <div key={c.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{c.title}</div>
                    <div className="text-xs text-slate-400">ID: {c.id}</div>
                    <div className="mt-1 text-xs text-slate-300">{c.shortDescription}</div>
                    <div className="mt-1 text-xs text-slate-400">Путь: {c.pagePath}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={() => startEdit(c)} className="rounded border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-white/40">
                      Ред.
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Удалить категорию "${c.title}"?`)) return;
                        const ok = await remove(c.id);
                        if (ok) toast.success('Категория удалена');
                        else toast.error('Ошибка удаления категории');
                      }}
                      className="rounded border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 hover:border-red-400"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {sortedCategories.length === 0 && <div className="text-center text-slate-400">Категорий пока нет</div>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCategoriesPage;
