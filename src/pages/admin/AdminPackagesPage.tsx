import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Package as PackageIcon } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button, ConfirmModal, EmptyState, Field, Input, Textarea } from '../../components/admin/ui';
import { adminPackagesPageContent } from '../../content/pages/adminPackages';
import type { Package } from '../../data/packages';
import { useFormDraftPersistence } from '../../hooks/useFormDraftPersistence';
import { usePackages } from '../../hooks/usePackages';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';

const schema = z.object({
  id: z.coerce.number().int().positive(adminPackagesPageContent.validation.idPositive),
  name: z.string().min(2, adminPackagesPageContent.validation.nameRequired),
  forFormatsText: z.string().min(1, adminPackagesPageContent.validation.forFormatsRequired),
  includesText: z.string().min(1, adminPackagesPageContent.validation.includesRequired),
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
    .map((item) => item.trim())
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

  const { clearDraft: clearPackageDraft, hasDraft: hasPackageDraft, isHydrated } =
    useFormDraftPersistence<FormValues>({
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
      toast.error(adminPackagesPageContent.toast.saveError);
      return;
    }

    toast.success(editingId ? adminPackagesPageContent.toast.updated : adminPackagesPageContent.toast.created);
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
    if (ok) {
      toast.success(adminPackagesPageContent.toast.deleted);
    } else {
      toast.error(adminPackagesPageContent.toast.deleteError);
    }
  };

  const handleResetDefaults = async () => {
    await resetToDefault();
    toast.success(adminPackagesPageContent.toast.resetSuccess);
    clearPackageDraft();
  };

  const filteredPackages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [...packages];

    return packages.filter((item) => {
      const haystack = [
        String(item.id),
        item.name,
        ...(item.forFormats ?? []),
        ...(item.includes ?? []),
        ...(item.options ?? []),
        item.priceHint ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [packages, search]);

  return (
    <AdminLayout
      title={adminPackagesPageContent.layout.title}
      subtitle={adminPackagesPageContent.layout.subtitle}
    >
      <ConfirmModal
        open={Boolean(deleteTarget)}
        danger
        title={adminPackagesPageContent.deleteModal.title}
        description={deleteTarget ? adminPackagesPageContent.deleteModal.description(deleteTarget.name) : ''}
        confirmText={adminPackagesPageContent.deleteModal.confirmText}
        cancelText={adminPackagesPageContent.deleteModal.cancelText}
        confirmDisabled={isSubmitting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <ConfirmModal
        open={resetModalOpen}
        danger
        title={adminPackagesPageContent.resetModal.title}
        description={adminPackagesPageContent.resetModal.description}
        confirmText={adminPackagesPageContent.resetModal.confirmText}
        cancelText={adminPackagesPageContent.resetModal.cancelText}
        confirmDisabled={isSubmitting}
        onCancel={() => setResetModalOpen(false)}
        onConfirm={handleResetDefaults}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {editingId ? adminPackagesPageContent.form.editTitle : adminPackagesPageContent.form.createTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {editingId
                  ? adminPackagesPageContent.form.editDescription(editingId)
                  : adminPackagesPageContent.form.createDescription}
              </p>
              {isHydrated && hasPackageDraft && !editingId && (
                <p className="mt-2 text-xs text-amber-200">{adminPackagesPageContent.form.restoredDraft}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {editingId && (
                <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-xs text-brand-100">
                  {adminPackagesPageContent.form.editMode}
                </span>
              )}
              {isDirty && (
                <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                  {adminPackagesPageContent.form.unsavedChanges}
                </span>
              )}
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSubmitting}
                  className="text-sm text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {adminPackagesPageContent.form.cancel}
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Field label={adminPackagesPageContent.form.idLabel} required error={errors.id?.message}>
              <Input disabled={Boolean(editingId)} {...register('id')} />
            </Field>

            <Field label={adminPackagesPageContent.form.nameLabel} required error={errors.name?.message}>
              <Input {...register('name')} />
            </Field>

            <Field
              label={adminPackagesPageContent.form.forFormatsLabel}
              required
              hint={adminPackagesPageContent.form.forFormatsHint}
              error={errors.forFormatsText?.message}
            >
              <Textarea rows={2} {...register('forFormatsText')} />
            </Field>

            <Field
              label={adminPackagesPageContent.form.includesLabel}
              required
              hint={adminPackagesPageContent.form.includesHint}
              error={errors.includesText?.message}
            >
              <Textarea rows={3} {...register('includesText')} />
            </Field>

            <Field label={adminPackagesPageContent.form.optionsLabel} hint={adminPackagesPageContent.form.optionsHint}>
              <Textarea rows={2} {...register('optionsText')} />
            </Field>

            <Field label={adminPackagesPageContent.form.priceHintLabel}>
              <Input {...register('priceHint')} />
            </Field>

            <Button type="submit" loading={isSubmitting} className="w-full">
              {editingId ? adminPackagesPageContent.form.save : adminPackagesPageContent.form.add}
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">{adminPackagesPageContent.list.title}</h2>
              <p className="mt-1 text-sm text-slate-400">
                {adminPackagesPageContent.list.shown(filteredPackages.length, packages.length)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              disabled={isSubmitting}
              className="text-sm text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {adminPackagesPageContent.list.resetToDefault}
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={adminPackagesPageContent.list.searchPlaceholder}
            />
            {search && (
              <Button type="button" variant="ghost" size="md" onClick={() => setSearch('')}>
                {adminPackagesPageContent.list.clear}
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {filteredPackages.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-xs text-slate-400">ID: {item.id}</div>
                    <div className="mt-1 text-xs text-slate-300">
                      {adminPackagesPageContent.list.forFormatsPrefix} {item.forFormats.join(', ')}
                    </div>
                    <div className="mt-1 text-xs text-slate-300">
                      {adminPackagesPageContent.list.includesPrefix} {item.includes.join(' · ')}
                    </div>
                    {item.priceHint && <div className="mt-1 text-xs text-brand-100">{item.priceHint}</div>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      disabled={isSubmitting}
                      className="rounded border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {adminPackagesPageContent.list.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      disabled={isSubmitting}
                      className="rounded border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {adminPackagesPageContent.list.remove}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredPackages.length === 0 && (
              <EmptyState
                icon={<PackageIcon size={32} className="text-brand-400" />}
                title={
                  packages.length === 0
                    ? adminPackagesPageContent.list.emptyTitle
                    : adminPackagesPageContent.list.notFoundTitle
                }
                description={
                  packages.length === 0
                    ? adminPackagesPageContent.list.emptyDescription
                    : adminPackagesPageContent.list.notFoundDescription
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
