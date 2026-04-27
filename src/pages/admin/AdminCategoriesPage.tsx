import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tag } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminEditPanelHeader, Button, ConfirmModal, EmptyState, FallbackDot, Field, Input, Textarea } from '../../components/admin/ui';
import { useI18n } from '../../context/I18nContext';
import { getAdminCategoriesPageContent } from '../../content/pages/adminCategories';
import type { Category } from '../../data/categories';
import { useCategories } from '../../hooks/useCategories';
import { useFormDraftPersistence } from '../../hooks/useFormDraftPersistence';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { useAdminCrudHandlers } from '../../hooks/useAdminCrudHandlers';
import { getAdminSourceLabel } from '../../lib/i18n/adminSourceLabel';

const createSchema = (content: ReturnType<typeof getAdminCategoriesPageContent>) =>
  z.object({
    id: z.coerce.number().int().positive(content.validation.idPositive),
    title: z.string().min(2, content.validation.titleRequired),
    shortDescription: z.string().min(5, content.validation.shortDescriptionRequired),
    bulletsText: z.string().min(2, content.validation.bulletsRequired),
    pagePath: z.string().min(2, content.validation.pagePathRequired).regex(/^\//, content.validation.pagePathPrefix),
  });

type FormValues = z.infer<ReturnType<typeof createSchema>>;

const defaultValues: FormValues = {
  id: 0,
  title: '',
  shortDescription: '',
  bulletsText: '',
  pagePath: '/rent/',
};

const splitList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const AdminCategoriesPage = () => {
  const { adminLocale, adminContentLocale, setAdminContentLocale } = useI18n();
  const adminCategoriesPageContent = getAdminCategoriesPageContent(adminLocale);
  const schema = useMemo(() => createSchema(adminCategoriesPageContent), [adminCategoriesPageContent]);
  const { categories, getEditorCategory, fallbackById, upsert, remove, resetToDefault } = useCategories(adminContentLocale);
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

  const { clearDraft: clearCategoryDraft, hasDraft: hasCategoryDraft, isHydrated } =
    useFormDraftPersistence<FormValues>({
      enabled: true,
      storageKey: `admin-category-draft-v2-${adminContentLocale}`,
      reset,
      watch,
    });

  useUnsavedChangesGuard(isDirty);

  React.useEffect(() => {
    setDeleteTarget(null);
    setResetModalOpen(false);
    setSearch('');

    if (editingId === null) {
      reset(defaultValues);
      return;
    }

    const currentItem = getEditorCategory(editingId);
    if (!currentItem) {
      reset(defaultValues);
      return;
    }

    reset({
      id: currentItem.id,
      title: currentItem.title,
      shortDescription: currentItem.shortDescription,
      bulletsText: currentItem.bullets.join('\n'),
      pagePath: currentItem.pagePath,
    });
  }, [adminContentLocale, editingId, getEditorCategory, reset]);

  React.useEffect(() => {
    if (editingId === null) return;

    const currentItem = getEditorCategory(editingId);
    if (!currentItem) return;

    reset({
      id: currentItem.id,
      title: currentItem.title,
      shortDescription: currentItem.shortDescription,
      bulletsText: currentItem.bullets.join('\n'),
      pagePath: currentItem.pagePath,
    });
  }, [editingId, getEditorCategory, reset]);

  const { onSubmit, cancelEdit, handleDelete, handleResetDefaults } = useAdminCrudHandlers<
    Category,
    FormValues,
    Category,
    Category['id']
  >({
    editingId,
    setEditingId,
    deleteTarget,
    setDeleteTarget,
    buildPayload: (values) => ({
      id: values.id,
      title: values.title.trim(),
      shortDescription: values.shortDescription.trim(),
      bullets: splitList(values.bulletsText),
      pagePath: values.pagePath.trim(),
    }),
    upsert,
    remove,
    resetToDefault,
    reset,
    defaultValues,
    clearDraft: clearCategoryDraft,
    toastCopy: {
      created: adminCategoriesPageContent.toast.created,
      updated: adminCategoriesPageContent.toast.updated,
      saveError: adminCategoriesPageContent.toast.saveError,
      deleted: adminCategoriesPageContent.toast.deleted,
      deleteError: adminCategoriesPageContent.toast.deleteError,
      resetSuccess: adminCategoriesPageContent.toast.resetSuccess,
    },
  });

  const startEdit = (item: Category) => {
    const editorItem = getEditorCategory(item.id) ?? item;
    setEditingId(item.id);
    reset({
      id: editorItem.id,
      title: editorItem.title,
      shortDescription: editorItem.shortDescription,
      bulletsText: editorItem.bullets.join('\n'),
      pagePath: editorItem.pagePath,
    });
  };

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [...categories];

    return categories.filter((item) => {
      const haystack = [item.id, item.title, item.shortDescription, ...(item.bullets ?? []), item.pagePath]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [categories, search]);

  const editingFallbackUsed = adminContentLocale === 'en' && editingId !== null && !!fallbackById[String(editingId)];
  const sourceLabel = getAdminSourceLabel({
    adminLocale,
    contentLocale: adminContentLocale,
    fallbackUsed: editingFallbackUsed,
  });

  return (
    <AdminLayout
      title={adminCategoriesPageContent.layout.title}
      subtitle={adminCategoriesPageContent.layout.subtitle}
      contentLocale={adminContentLocale}
      onContentLocaleChange={setAdminContentLocale}
    >
      <ConfirmModal
        open={Boolean(deleteTarget)}
        danger
        title={adminCategoriesPageContent.deleteModal.title}
        description={deleteTarget ? adminCategoriesPageContent.deleteModal.description(deleteTarget.title) : ''}
        confirmText={adminCategoriesPageContent.deleteModal.confirmText}
        cancelText={adminCategoriesPageContent.deleteModal.cancelText}
        confirmDisabled={isSubmitting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <ConfirmModal
        open={resetModalOpen}
        danger
        title={adminCategoriesPageContent.resetModal.title}
        description={adminCategoriesPageContent.resetModal.description}
        confirmText={adminCategoriesPageContent.resetModal.confirmText}
        cancelText={adminCategoriesPageContent.resetModal.cancelText}
        confirmDisabled={isSubmitting}
        onCancel={() => setResetModalOpen(false)}
        onConfirm={handleResetDefaults}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.85fr)]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 shadow-2xl shadow-black/10 lg:order-2 lg:sticky lg:top-6 lg:self-start">
          <AdminEditPanelHeader
            title={editingId ? adminCategoriesPageContent.form.editTitle : adminCategoriesPageContent.form.createTitle}
            description={
              editingId
                ? adminCategoriesPageContent.form.editDescription(editingId)
                : adminCategoriesPageContent.form.createDescription
            }
            draftHint={isHydrated && hasCategoryDraft && !editingId ? adminCategoriesPageContent.form.restoredDraft : undefined}
            sourceLabel={sourceLabel}
            isEditing={Boolean(editingId)}
            isDirty={isDirty}
            editModeLabel={adminCategoriesPageContent.form.editMode}
            unsavedLabel={adminCategoriesPageContent.form.unsavedChanges}
            cancelLabel={adminCategoriesPageContent.form.cancel}
            onCancel={cancelEdit}
            cancelDisabled={isSubmitting}
          />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
            <Field label={adminCategoriesPageContent.form.idLabel} required error={errors.id?.message}>
              <Input disabled={Boolean(editingId)} {...register('id')} />
            </Field>

            <Field label={adminCategoriesPageContent.form.titleLabel} required error={errors.title?.message}>
              <Input {...register('title')} />
            </Field>

            <Field
              label={adminCategoriesPageContent.form.shortDescriptionLabel}
              required
              error={errors.shortDescription?.message}
            >
              <Textarea rows={2} {...register('shortDescription')} />
            </Field>

            <Field
              label={adminCategoriesPageContent.form.bulletsLabel}
              required
              hint={adminCategoriesPageContent.form.bulletsHint}
              error={errors.bulletsText?.message}
            >
              <Textarea rows={3} {...register('bulletsText')} />
            </Field>

            <Field label={adminCategoriesPageContent.form.pagePathLabel} required error={errors.pagePath?.message}>
              <Input {...register('pagePath')} />
            </Field>

            <Button type="submit" loading={isSubmitting} className="w-full">
              {editingId ? adminCategoriesPageContent.form.save : adminCategoriesPageContent.form.add}
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 shadow-2xl shadow-black/10 lg:order-1">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">{adminCategoriesPageContent.list.title}</h2>
              <p className="mt-1 text-xs text-slate-400">
                {adminCategoriesPageContent.list.shown(filteredCategories.length, categories.length)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              disabled={isSubmitting}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {adminCategoriesPageContent.list.resetToDefault}
            </button>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={adminCategoriesPageContent.list.searchPlaceholder}
            />
            {search && (
              <Button type="button" variant="ghost" size="md" onClick={() => setSearch('')}>
                {adminCategoriesPageContent.list.clear}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {filteredCategories.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-white/20 hover:bg-slate-900 active:scale-[0.998]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <span className="truncate">{item.title}</span>
                      <FallbackDot visible={adminContentLocale === 'en' && !!fallbackById[String(item.id)]} adminLocale={adminLocale} />
                    </div>
                    <div className="font-mono text-xs text-slate-500">ID: {item.id}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-300">{item.shortDescription}</div>
                    <div className="mt-1 truncate text-xs text-slate-400">
                      {adminCategoriesPageContent.list.pagePathPrefix} {item.pagePath}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      disabled={isSubmitting}
                      className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-emerald-400/40 hover:bg-emerald-500/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {adminCategoriesPageContent.list.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      disabled={isSubmitting}
                      className="rounded-lg border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 transition hover:border-red-300 hover:bg-red-500/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {adminCategoriesPageContent.list.remove}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <EmptyState
                icon={<Tag size={32} className="text-emerald-300" />}
                title={
                  categories.length === 0
                    ? adminCategoriesPageContent.list.emptyTitle
                    : adminCategoriesPageContent.list.notFoundTitle
                }
                description={
                  categories.length === 0
                    ? adminCategoriesPageContent.list.emptyDescription
                    : adminCategoriesPageContent.list.notFoundDescription
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
