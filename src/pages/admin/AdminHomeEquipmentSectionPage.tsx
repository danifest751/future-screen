import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button, FallbackDot, Field, Input, Textarea } from '../../components/admin/ui';
import { useI18n } from '../../context/I18nContext';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { useHomeEquipmentSectionHeader } from '../../hooks/useHomeEquipmentSectionHeader';
import { getAdminSourceLabel } from '../../lib/i18n/adminSourceLabel';
import { getAdminHomeEquipmentSectionContent } from '../../content/pages/adminHomeEquipmentSection';

const createSchema = (requiredText: string) =>
  z.object({
    badge: z.string().trim().min(1, requiredText),
    title: z.string().trim().min(1, requiredText),
    accentTitle: z.string().trim().min(1, requiredText),
    subtitle: z.string().trim().min(1, requiredText),
  });

type FormValues = z.infer<ReturnType<typeof createSchema>>;

const defaultValues: FormValues = {
  badge: '',
  title: '',
  accentTitle: '',
  subtitle: '',
};

const AdminHomeEquipmentSectionPage = () => {
  const { adminLocale, adminContentLocale, setAdminContentLocale } = useI18n();
  const content = getAdminHomeEquipmentSectionContent(adminLocale);
  const schema = useMemo(() => createSchema(content.validation.required), [content.validation.required]);
  const localeTag = adminLocale === 'ru' ? 'ru-RU' : 'en-US';

  const { data, fallbackUsed, loading, saving, save } = useHomeEquipmentSectionHeader(adminContentLocale, true);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    setLastSaved(null);
    reset(defaultValues);
  }, [adminContentLocale, reset]);

  useEffect(() => {
    if (!data) {
      reset(defaultValues);
      return;
    }

    reset({
      badge: data.badge,
      title: data.title,
      accentTitle: data.accentTitle,
      subtitle: data.subtitle,
    });
  }, [data, reset]);

  const sourceLabel = getAdminSourceLabel({
    adminLocale,
    contentLocale: adminContentLocale,
    fallbackUsed: adminContentLocale === 'en' && fallbackUsed,
  });

  const onSubmit = async (values: FormValues) => {
    const ok = await save({
      badge: values.badge.trim(),
      title: values.title.trim(),
      accentTitle: values.accentTitle.trim(),
      subtitle: values.subtitle.trim(),
    });

    if (ok) {
      setLastSaved(new Date().toLocaleString(localeTag));
      toast.success(content.toasts.saveSuccess);
      return;
    }

    toast.error(content.toasts.saveError);
  };

  if (loading) {
    return (
      <AdminLayout
        title={content.layout.title}
        subtitle={content.layout.loadingSubtitle}
        contentLocale={adminContentLocale}
        onContentLocaleChange={setAdminContentLocale}
      >
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={content.layout.title}
      subtitle={lastSaved ? content.layout.lastSaved(lastSaved) : undefined}
      contentLocale={adminContentLocale}
      onContentLocaleChange={setAdminContentLocale}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-white">{content.editor.title}</h2>
              <FallbackDot visible={adminContentLocale === 'en' && fallbackUsed} adminLocale={adminLocale} />
            </div>
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-slate-300">
              {sourceLabel}
            </span>
            {isDirty && (
              <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                {content.editor.unsavedChanges}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label={content.editor.badgeLabel} required error={errors.badge?.message}>
              <Input {...register('badge')} />
            </Field>
            <Field label={content.editor.titleLabel} required error={errors.title?.message}>
              <Input {...register('title')} />
            </Field>
            <Field label={content.editor.accentTitleLabel} required error={errors.accentTitle?.message}>
              <Input {...register('accentTitle')} />
            </Field>
            <Field label={content.editor.subtitleLabel} required error={errors.subtitle?.message}>
              <Textarea rows={4} {...register('subtitle')} />
            </Field>

            <Button type="submit" loading={isSubmitting || saving} className="w-full">
              {content.editor.save}
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">{content.preview.title}</h2>
          <div className="space-y-4 rounded-lg border border-white/10 bg-slate-900/50 p-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
              {data?.badge || defaultValues.badge}
            </div>
            <h3 className="font-display text-3xl font-bold text-white">
              {data?.title || defaultValues.title}{' '}
              <span className="gradient-text">{data?.accentTitle || defaultValues.accentTitle}</span>
            </h3>
            <p className="max-w-2xl text-gray-400">{data?.subtitle || defaultValues.subtitle}</p>
            <div className="pt-2 text-xs text-slate-400">
              {content.preview.sourceLabel}: {sourceLabel}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHomeEquipmentSectionPage;
