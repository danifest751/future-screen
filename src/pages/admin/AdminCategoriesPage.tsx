import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button, ConfirmModal, EmptyState, Field, Input, Textarea } from '../../components/admin/ui';
import { useCategories } from '../../hooks/useCategories';
import { useFormDraftPersistence } from '../../hooks/useFormDraftPersistence';
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
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { clearDraft: clearCategoryDraft, hasDraft: hasCategoryDraft, isHydrated } = useFormDraftPersistence<FormValues>({
    enabled: true,
    storageKey: 'admin-category-draft',
    reset,
    watch,
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
    clearCategoryDraft();
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
    clearCategoryDraft();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await remove(deleteTarget.id);
    if (ok) toast.success('Категория удалена');
    else toast.error('Ошибка удаления категории');
  };

  const handleResetDefaults = async () => {
    await resetToDefault();
    toast.success('Категории сброшены к дефолту');
    clearCategoryDraft();
  };

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [...categories];

    return categories.filter((c) => {
      const haystack = [c.id, c.title, c.shortDescription, ...(c.bullets ?? []), c.pagePath]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [categories, search]);

  return (
    <AdminLayout title="Категории" subtitle="Управление категориями аренды">
      <ConfirmModal
        open={Boolean(deleteTarget)}
        danger
        title="Удалить категорию?"
        description={deleteTarget ? `Категория "${deleteTarget.title}" будет удалена без возможности восстановления.` : ''}
        confirmText="Удалить"
        cancelText="Отмена"
        confirmDisabled={isSubmitting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <ConfirmModal
        open={resetModalOpen}
        danger
        title="Сбросить категории к дефолту?"
        description="Текущий список категорий будет перезаписан демо-данными."
        confirmText="Сбросить"
        cancelText="Отмена"
        confirmDisabled={isSubmitting}
        onCancel={() => setResetModalOpen(false)}
        onConfirm={handleResetDefaults}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">{editingId ? 'Редактирование категории' : 'Новая категория'}</h2>
              <p className="mt-1 text-sm text-slate-400">
                {editingId
                  ? `Вы редактируете категорию ${String(editingId)}. Сохраните изменения или нажмите «Отмена».`
                  : 'Создайте новую категорию или выберите существующую справа для редактирования.'}
              </p>
              {isHydrated && hasCategoryDraft && !editingId && (
                <p className="mt-2 text-xs text-amber-200">Восстановлен черновик формы — можно продолжить с того же места.</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {editingId && (
                <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-xs text-brand-100">
                  Режим редактирования
                </span>
              )}
              {isDirty && (
                <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                  Есть несохраненные изменения
                </span>
              )}
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSubmitting}
                  className="text-sm text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Отмена
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Field label="ID" required error={errors.id?.message}>
              <Input disabled={Boolean(editingId)} {...register('id')} />
            </Field>

            <Field label="Название" required error={errors.title?.message}>
              <Input {...register('title')} />
            </Field>

            <Field label="Краткое описание" required error={errors.shortDescription?.message}>
              <Textarea rows={2} {...register('shortDescription')} />
            </Field>

            <Field
              label="Буллеты"
              required
              hint="Каждый пункт с новой строки"
              error={errors.bulletsText?.message}
            >
              <Textarea rows={3} {...register('bulletsText')} />
            </Field>

            <Field label="Путь страницы" required error={errors.pagePath?.message}>
              <Input {...register('pagePath')} />
            </Field>

            <Button type="submit" loading={isSubmitting} className="w-full">
              {editingId ? 'Сохранить' : 'Добавить'}
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Список категорий</h2>
              <p className="mt-1 text-sm text-slate-400">
                Показано {filteredCategories.length} из {categories.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              disabled={isSubmitting}
              className="text-sm text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Сброс к дефолту
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию, пути, описанию..."
            />
            {search && (
              <Button type="button" variant="ghost" size="md" onClick={() => setSearch('')}>
                Очистить
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {filteredCategories.map((c) => (
              <div key={c.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{c.title}</div>
                    <div className="text-xs text-slate-400">ID: {c.id}</div>
                    <div className="mt-1 text-xs text-slate-300">{c.shortDescription}</div>
                    <div className="mt-1 text-xs text-slate-400">Путь: {c.pagePath}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      disabled={isSubmitting}
                      className="rounded border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(c)}
                      disabled={isSubmitting}
                      className="rounded border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <EmptyState
                icon="🗂️"
                title={categories.length === 0 ? 'Категорий пока нет' : 'Ничего не найдено'}
                description={
                  categories.length === 0
                    ? 'Создайте первую категорию аренды через форму слева.'
                    : 'Попробуйте изменить поисковый запрос или очистить фильтр.'
                }
              />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCategoriesPage;
