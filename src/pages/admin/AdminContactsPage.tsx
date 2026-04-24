import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button, ConfirmModal, EmptyState, FallbackDot, Field, Input, Textarea } from '../../components/admin/ui';
import { useI18n } from '../../context/I18nContext';
import { adminContactsPageContent as adminContactsPageContentStatic, getAdminContactsPageContent } from '../../content/pages/adminContacts';
import { useContacts } from '../../hooks/useContacts';
import { useFormDraftPersistence } from '../../hooks/useFormDraftPersistence';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { getAdminSourceLabel } from '../../lib/i18n/adminSourceLabel';

const schema = z.object({
  phonesText: z.string().min(3, adminContactsPageContentStatic.validation.phonesRequired),
  emailsText: z.string().min(3, adminContactsPageContentStatic.validation.emailsRequired),
  address: z.string().min(5, adminContactsPageContentStatic.validation.addressRequired),
  workingHours: z.string().min(2, adminContactsPageContentStatic.validation.workingHoursRequired),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  phonesText: '',
  emailsText: '',
  address: '',
  workingHours: '',
};

const splitLines = (value: string) =>
  value
    .split(/\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const AdminContactsPage = () => {
  const { adminLocale, adminContentLocale, setAdminContentLocale } = useI18n();
  const adminContactsPageContent = getAdminContactsPageContent(adminLocale);
  const { contacts, editorContacts, fallbackUsed, loading, update, resetToDefault } = useContacts(adminContentLocale);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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

  const { clearDraft: clearContactsDraft, hasDraft: hasContactsDraft, isHydrated } =
    useFormDraftPersistence<FormValues>({
      enabled: true,
      storageKey: `admin-contacts-draft-v2-${adminContentLocale}`,
      reset,
      watch,
    });

  useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    setResetModalOpen(false);
    setIsInitialized(false);
    void clearContactsDraft();
    reset(defaultValues);
  }, [adminContentLocale, clearContactsDraft, reset]);

  useEffect(() => {
    if (!isHydrated || loading || !editorContacts) return;
    if (isInitialized) return;

    reset({
      phonesText: editorContacts.phones.join('\n'),
      emailsText: editorContacts.emails.join('\n'),
      address: editorContacts.address,
      workingHours: editorContacts.workingHours,
    });
    setIsInitialized(true);
  }, [editorContacts, isHydrated, loading, reset, isInitialized]);

  const onSubmit = async (values: FormValues) => {
    const sanitizedValues: FormValues = {
      phonesText: splitLines(values.phonesText).join('\n'),
      emailsText: splitLines(values.emailsText).join('\n'),
      address: values.address.trim(),
      workingHours: values.workingHours.trim(),
    };

    const ok = await update({
      phones: splitLines(sanitizedValues.phonesText),
      emails: splitLines(sanitizedValues.emailsText),
      address: sanitizedValues.address,
      workingHours: sanitizedValues.workingHours,
    });

    if (ok) {
      toast.success(adminContactsPageContent.toast.saveSuccess);
      reset(sanitizedValues);
      void clearContactsDraft();
    } else {
      toast.error(adminContactsPageContent.toast.saveError);
    }
  };

  const handleResetDefaults = async () => {
    const ok = await resetToDefault();
    if (!ok) {
      toast.error(adminContactsPageContent.toast.saveError);
      return;
    }
    reset(defaultValues);
    setIsInitialized(false);
    toast.success(adminContactsPageContent.toast.resetSuccess);
    void clearContactsDraft();
  };

  const sourceLabel = getAdminSourceLabel({
    adminLocale,
    contentLocale: adminContentLocale,
    fallbackUsed: adminContentLocale === 'en' && fallbackUsed,
  });

  if (loading) {
    return (
      <AdminLayout
        title={adminContactsPageContent.layout.title}
        subtitle={adminContactsPageContent.layout.loadingSubtitle}
        contentLocale={adminContentLocale}
        onContentLocaleChange={setAdminContentLocale}
      >
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (!contacts) {
    return (
      <AdminLayout
        title={adminContactsPageContent.layout.title}
        subtitle={adminContactsPageContent.layout.loadErrorSubtitle}
        contentLocale={adminContentLocale}
        onContentLocaleChange={setAdminContentLocale}
      >
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-300">
          <p className="text-lg font-medium">{adminContactsPageContent.states.notLoadedTitle}</p>
          <p className="mt-2 text-sm">{adminContactsPageContent.states.notLoadedDescription}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={adminContactsPageContent.layout.title}
      subtitle={adminContactsPageContent.layout.subtitle}
      contentLocale={adminContentLocale}
      onContentLocaleChange={setAdminContentLocale}
    >
      <ConfirmModal
        open={resetModalOpen}
        danger
        title={adminContactsPageContent.resetModal.title}
        description={adminContactsPageContent.resetModal.description}
        confirmText={adminContactsPageContent.resetModal.confirmText}
        cancelText={adminContactsPageContent.resetModal.cancelText}
        confirmDisabled={isSubmitting}
        onCancel={() => setResetModalOpen(false)}
        onConfirm={handleResetDefaults}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-4 lg:order-2 lg:sticky lg:top-6 lg:self-start">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-white">{adminContactsPageContent.form.title}</h2>
              <FallbackDot visible={adminContentLocale === 'en' && fallbackUsed} adminLocale={adminLocale} />
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-slate-300">
                {sourceLabel}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {isHydrated && hasContactsDraft && (
                <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-xs text-brand-100">
                  {adminContactsPageContent.form.restoredDraft}
                </span>
              )}
              {isDirty && (
                <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                  {adminContactsPageContent.form.unsavedChanges}
                </span>
              )}
              <button
                type="button"
                onClick={() => setResetModalOpen(true)}
                disabled={isSubmitting}
                className="text-sm text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adminContactsPageContent.form.resetToDefault}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
            <Field
              label={adminContactsPageContent.form.phonesLabel}
              required
              hint={adminContactsPageContent.form.phonesHint}
              error={errors.phonesText?.message}
            >
              <Textarea rows={4} {...register('phonesText')} />
            </Field>

            <Field
              label={adminContactsPageContent.form.emailsLabel}
              required
              hint={adminContactsPageContent.form.emailsHint}
              error={errors.emailsText?.message}
            >
              <Textarea rows={3} {...register('emailsText')} />
            </Field>

            <Field label={adminContactsPageContent.form.addressLabel} required error={errors.address?.message}>
              <Input {...register('address')} />
            </Field>

            <Field
              label={adminContactsPageContent.form.workingHoursLabel}
              required
              error={errors.workingHours?.message}
            >
              <Input {...register('workingHours')} />
            </Field>

            <Button type="submit" loading={isSubmitting} className="w-full">
              {adminContactsPageContent.form.submit}
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800 p-4 text-sm text-slate-200 lg:order-1">
          <h2 className="mb-3 text-base font-semibold text-white">{adminContactsPageContent.current.title}</h2>
          {!contacts.phones.length && !contacts.emails.length ? (
            <EmptyState
              icon={<Phone size={32} className="text-brand-400" />}
              title={adminContactsPageContent.current.emptyTitle}
              description={adminContactsPageContent.current.emptyDescription}
            />
          ) : (
            <div className="grid gap-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <div className="text-xs text-slate-400">{adminContactsPageContent.current.phonesLabel}</div>
                <div className="mt-1 text-white">{contacts.phones.join(', ')}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <div className="text-xs text-slate-400">{adminContactsPageContent.current.emailsLabel}</div>
                <div className="mt-1 text-white">{contacts.emails.join(', ')}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <div className="text-xs text-slate-400">{adminContactsPageContent.current.addressLabel}</div>
                <div className="mt-1 text-white">{contacts.address}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <div className="text-xs text-slate-400">{adminContactsPageContent.current.workingHoursLabel}</div>
                <div className="mt-1 text-white">{contacts.workingHours}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContactsPage;
