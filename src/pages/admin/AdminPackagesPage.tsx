import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button, ConfirmModal, EmptyState, Field, Input, Textarea } from '../../components/admin/ui';
import { Package as PackageIcon } from 'lucide-react';
import { usePackages } from '../../hooks/usePackages';
import { useFormDraftPersistence } from '../../hooks/useFormDraftPersistence';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import type { Package } from '../../data/packages';

const schema = z.object({
  id: z.coerce.number().int().positive('ID должен быть числом'),
  name: z.string().min(2, 'Название обязательно'),
  forFormatsText: z.string().min(1, 'Укажите хотя бы 1 формат'),
  includesText: z.string().min(1, 'Укажите состав пакета'),
  optionsText: z.string().optional(),
  priceHint: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  id: 0,
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
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);
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

  const { clearDraft: clearPackageDraft, hasDraft: hasPackageDraft, isHydrated } = useFormDraftPersistence<FormValues>({
    enabled: true,
    storageKey: 'admin-package-draft',
    reset,
    watch,
  });

  useUnsavedChangesGuard(isDirty);

  const onSubmit = async (values: FormValues) => {
    const payload: Package = {
      id: values.id,
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
    clearPackageDraft();
  };

  const startEdit = (item: Package) => {
    setEditingId(item.id);
    reset({
      id: item.id,
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
    clearPackageDraft();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await remove(deleteTarget.id);
    if (ok) toast.success('Пакет удалён');
    else toast.error('Ошибка удаления пакета');
  };

  const handleResetDefaults = async () => {
    await resetToDefault();
    toast.success('Пакеты сброшены к дефолту');
    clearPackageDraft();
  };

  const filteredPackages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [...packages];

    return packages.filter((p) => {
      const haystack = [
        String(p.id),
        p.name,
        ...(p.forFormats ?? []),
        ...(p.includes ?? []),
        ...(p.options ?? []),
        p.priceHint ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [packages, search]);

  return (
    <AdminLayout title="Пакеты" subtitle="Управление пакетами и ценовыми предложениями">
      <ConfirmModal
        open={Boolean(deleteTarget)}
        danger
        title="Удалить пакет?"
        description={deleteTarget ? `Пакет "${deleteTarget.name}" будет удален без возможности восстановления.` : ''}
        confirmText="Удалить"
        cancelText="Отмена"
        confirmDisabled={isSubmitting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <ConfirmModal
        open={resetModalOpen}
        danger
        title="Сбросить все пакеты к дефолту?"
        description="Текущие изменения будут перезаписаны демо-данными."
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
              <h2 className="text-xl font-semibold text-white">{editingId ? 'Редактирование пакета' : 'Новый пакет'}</h2>
              <p className="mt-1 text-sm text-slate-400">
                {editingId
                  ? `Вы редактируете пакет ${String(editingId)}. Сохраните изменения или нажмите «Отмена».`
                  : 'Создайте новый пакет или выберите существующий справа для редактирования.'}
              </p>
              {isHydrated && hasPackageDraft && !editingId && (
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

            <Field label="Название" required error={errors.name?.message}>
              <Input {...register('name')} />
            </Field>

            <Field
              label="Для форматов"
              required
              hint="Через запятую или новую строку"
              error={errors.forFormatsText?.message}
            >
              <Textarea rows={2} {...register('forFormatsText')} />
            </Field>

            <Field
              label="Состав"
              required
              hint="Каждый пункт с новой строки"
              error={errors.includesText?.message}
            >
              <Textarea rows={3} {...register('includesText')} />
            </Field>

            <Field label="Опции" hint="Необязательно">
              <Textarea rows={2} {...register('optionsText')} />
            </Field>

            <Field label="Подсказка цены">
              <Input {...register('priceHint')} />
            </Field>

            <Button type="submit" loading={isSubmitting} className="w-full">
              {editingId ? 'Сохранить' : 'Добавить'}
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Список пакетов</h2>
              <p className="mt-1 text-sm text-slate-400">
                Показано {filteredPackages.length} из {packages.length}
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
              placeholder="Поиск по названию, ID, составу, опциям..."
            />
            {search && (
              <Button type="button" variant="ghost" size="md" onClick={() => setSearch('')}>
                Очистить
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {filteredPackages.map((p) => (
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
                      disabled={isSubmitting}
                      className="rounded border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(p)}
                      disabled={isSubmitting}
                      className="rounded border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredPackages.length === 0 && (
              <EmptyState
                icon={<PackageIcon size={32} className="text-brand-400" />}
                title={packages.length === 0 ? 'Пакетов пока нет' : 'Ничего не найдено'}
                description={
                  packages.length === 0
                    ? 'Добавьте первый пакет через форму слева.'
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

export default AdminPackagesPage;
