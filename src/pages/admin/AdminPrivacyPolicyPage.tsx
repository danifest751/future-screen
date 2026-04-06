import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button, EmptyState, Field, Input, Textarea } from '../../components/admin/ui';
import { FileText } from 'lucide-react';
import { usePrivacyPolicy } from '../../hooks/usePrivacyPolicy';
import { useFormDraftPersistence } from '../../hooks/useFormDraftPersistence';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import Markdown from 'markdown-to-jsx';
import { sanitizeMarkdown } from '../../lib/sanitize';
import { useI18n } from '../../context/I18nContext';
import { adminPrivacyPolicyContent as adminPrivacyPolicyContentStatic, getAdminPrivacyPolicyContent } from '../../content/pages/adminPrivacyPolicy';

const schema = z.object({
  title: z.string().min(1, adminPrivacyPolicyContentStatic.validation.titleRequired),
  content: z.string().min(1, adminPrivacyPolicyContentStatic.validation.contentRequired),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  fontSize: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  title: '',
  content: '',
  metaTitle: '',
  metaDescription: '',
  fontSize: '',
};

const fontSizes = ['0.875rem', '1rem', '1.125rem', '1.5rem'];

const AdminPrivacyPolicyPage = () => {
  const { adminLocale } = useI18n();
  const adminPrivacyPolicyContent = getAdminPrivacyPolicyContent(adminLocale);
  const localeTag = adminLocale === 'ru' ? 'ru-RU' : 'en-US';
  const { content, loading, saving, save } = usePrivacyPolicy();
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const currentFontSize = watch('fontSize') || '1rem';
  const fontSizeIndex = fontSizes.indexOf(currentFontSize) >= 0 ? fontSizes.indexOf(currentFontSize) : 1;

  const { clearDraft: clearFormDraft, hasDraft: hasFormDraft, isHydrated } = useFormDraftPersistence<FormValues>({
    enabled: true,
    storageKey: 'admin-privacy-policy-draft',
    reset,
    watch,
  });

  useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    if (!isHydrated || hasFormDraft || !content) return;

    reset({
      title: content.title || '',
      content: content.content || '',
      metaTitle: content.metaTitle || '',
      metaDescription: content.metaDescription || '',
      fontSize: content.fontSize || '',
    });

    if (content.updatedAt) {
      setLastSaved(new Date(content.updatedAt).toLocaleString(localeTag));
    }
  }, [content, hasFormDraft, isHydrated, reset]);

  const onSubmit = async (values: FormValues) => {
    const ok = await save({
      title: values.title.trim(),
      content: values.content,
      metaTitle: values.metaTitle?.trim() || null,
      metaDescription: values.metaDescription?.trim() || null,
      fontSize: values.fontSize?.trim() || null,
    });

    if (ok) {
      toast.success(adminPrivacyPolicyContent.toasts.saveSuccess);
      clearFormDraft();
      setLastSaved(new Date().toLocaleString(localeTag));
    } else {
      toast.error(adminPrivacyPolicyContent.toasts.saveError);
    }
  };

  if (loading) {
    return (
      <AdminLayout
        title={adminPrivacyPolicyContent.layout.title}
        subtitle={adminPrivacyPolicyContent.layout.loadingSubtitle}
      >
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={adminPrivacyPolicyContent.layout.title}
      subtitle={lastSaved ? adminPrivacyPolicyContent.layout.lastSaved(lastSaved) : undefined}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">{adminPrivacyPolicyContent.editor.title}</h2>
            {isHydrated && hasFormDraft && (
              <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-xs text-brand-100">
                {adminPrivacyPolicyContent.editor.restoredDraft}
              </span>
            )}
            {isDirty && (
              <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                {adminPrivacyPolicyContent.editor.unsavedChanges}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field
              label={adminPrivacyPolicyContent.editor.pageTitleLabel}
              required
              error={errors.title?.message}
            >
              <Input
                {...register('title')}
                placeholder={adminPrivacyPolicyContent.editor.pageTitlePlaceholder}
              />
            </Field>

            <Field
              label={adminPrivacyPolicyContent.editor.contentLabel}
              required
              error={errors.content?.message}
            >
              <Textarea
                rows={20}
                {...register('content')}
                className="font-mono text-sm"
                placeholder={adminPrivacyPolicyContent.editor.contentPlaceholder}
              />
            </Field>

            <div className="border-t border-white/10 pt-4">
              <h3 className="mb-3 text-sm font-medium text-slate-300">{adminPrivacyPolicyContent.editor.seoTitle}</h3>
              <Field
                label={adminPrivacyPolicyContent.editor.metaTitleLabel}
                hint={adminPrivacyPolicyContent.editor.metaTitleHint}
                error={errors.metaTitle?.message}
              >
                <Input
                  {...register('metaTitle')}
                  placeholder={adminPrivacyPolicyContent.editor.metaTitlePlaceholder}
                />
              </Field>

              <Field
                label={adminPrivacyPolicyContent.editor.metaDescriptionLabel}
                hint={adminPrivacyPolicyContent.editor.metaDescriptionHint}
                error={errors.metaDescription?.message}
              >
                <Textarea
                  rows={2}
                  {...register('metaDescription')}
                  placeholder={adminPrivacyPolicyContent.editor.metaDescriptionPlaceholder}
                />
              </Field>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="mb-3 text-sm font-medium text-slate-300">{adminPrivacyPolicyContent.editor.fontSizeTitle}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {adminPrivacyPolicyContent.editor.fontSizeScale.map((label) => (
                    <span key={label} className="text-xs text-slate-400">{label}</span>
                  ))}
                </div>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={1}
                  value={fontSizeIndex}
                  onChange={(e) => setValue('fontSize', fontSizes[Number(e.target.value)])}
                  className="w-full accent-brand-500"
                />
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-slate-500">{adminPrivacyPolicyContent.editor.current}</span>
                  <span
                    className="rounded bg-slate-900 px-2 py-1 text-slate-200"
                    style={{ fontSize: watch('fontSize') || '1rem' }}
                  >
                    {watch('fontSize') || '1rem'} ({adminPrivacyPolicyContent.editor.defaultNote})
                  </span>
                </div>
              </div>
            </div>

            <Button type="submit" loading={isSubmitting || saving} className="w-full">
              {adminPrivacyPolicyContent.editor.save}
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">{adminPrivacyPolicyContent.preview.title}</h2>
            <button
              type="button"
              onClick={() => window.open('/privacy', '_blank')}
              className="text-sm text-brand-400 hover:text-brand-300"
            >
              {adminPrivacyPolicyContent.preview.openOnSite}
            </button>
          </div>

          {watch('content') ? (
            <div
              className="prose prose-invert prose-sm max-w-none overflow-auto rounded-lg bg-slate-900/50 p-4"
              style={{ maxHeight: '600px', fontSize: watch('fontSize') || undefined }}
            >
              <Markdown>{sanitizeMarkdown(watch('content'))}</Markdown>
            </div>
          ) : (
            <EmptyState
              icon={<FileText size={32} className="text-brand-400" />}
              title={adminPrivacyPolicyContent.preview.emptyTitle}
              description={adminPrivacyPolicyContent.preview.emptyDescription}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPrivacyPolicyPage;
