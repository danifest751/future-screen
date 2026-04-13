import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button, FallbackDot, Field, Input, Textarea } from '../../components/admin/ui';
import { useI18n } from '../../context/I18nContext';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { useHomeEquipmentSection } from '../../hooks/useHomeEquipmentSection';
import { getAdminSourceLabel } from '../../lib/i18n/adminSourceLabel';
import { getAdminHomeEquipmentSectionContent } from '../../content/pages/adminHomeEquipmentSection';
import type { HomeEquipmentSectionContent } from '../../lib/content/homeEquipmentSection';

type FormValues = {
  badge: string;
  title: string;
  accentTitle: string;
  subtitle: string;
  items: Array<{
    title: string;
    desc: string;
    bullets: string;
  }>;
  extraItems: Array<{
    title: string;
    desc: string;
  }>;
};

const createSchema = (requiredText: string) =>
  z.object({
    badge: z.string().trim().min(1, requiredText),
    title: z.string().trim().min(1, requiredText),
    accentTitle: z.string().trim().min(1, requiredText),
    subtitle: z.string().trim().min(1, requiredText),
    items: z.array(
      z.object({
        title: z.string().trim().min(1, requiredText),
        desc: z.string().trim().min(1, requiredText),
        bullets: z.string().trim().min(1, requiredText),
      }),
    ),
    extraItems: z.array(
      z.object({
        title: z.string().trim().min(1, requiredText),
        desc: z.string().trim().min(1, requiredText),
      }),
    ),
  });

const sectionToForm = (section: HomeEquipmentSectionContent): FormValues => ({
  badge: section.badge,
  title: section.title,
  accentTitle: section.accentTitle,
  subtitle: section.subtitle,
  items: section.items.map((item) => ({
    title: item.title,
    desc: item.desc,
    bullets: item.bullets.join('\n'),
  })),
  extraItems: section.extraItems.map((item) => ({
    title: item.title,
    desc: item.desc,
  })),
});

const applyFormToSection = (base: HomeEquipmentSectionContent, values: FormValues): HomeEquipmentSectionContent => ({
  ...base,
  badge: values.badge.trim(),
  title: values.title.trim(),
  accentTitle: values.accentTitle.trim(),
  subtitle: values.subtitle.trim(),
  items: base.items.map((item, index) => ({
    ...item,
    title: values.items[index]?.title.trim() ?? item.title,
    desc: values.items[index]?.desc.trim() ?? item.desc,
    bullets:
      values.items[index]?.bullets
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean) ?? item.bullets,
  })),
  extraItems: base.extraItems.map((item, index) => ({
    ...item,
    title: values.extraItems[index]?.title.trim() ?? item.title,
    desc: values.extraItems[index]?.desc.trim() ?? item.desc,
  })),
});

const AdminHomeEquipmentSectionPage = () => {
  const { adminLocale, adminContentLocale, setAdminContentLocale } = useI18n();
  const content = getAdminHomeEquipmentSectionContent(adminLocale);
  const schema = useMemo(() => createSchema(content.validation.required), [content.validation.required]);
  const localeTag = adminLocale === 'ru' ? 'ru-RU' : 'en-US';

  const { data, staticSection, fallbackUsed, hasDbRecord, loading, saving, save, initializeFromStatic } = useHomeEquipmentSection(
    adminContentLocale,
    true,
  );
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [previewSection, setPreviewSection] = useState<HomeEquipmentSectionContent>(staticSection);
  const initAttemptedRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: sectionToForm(staticSection),
  });

  useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    const source = data ?? staticSection;
    setPreviewSection(source);
    reset(sectionToForm(source));
    setLastSaved(null);
  }, [adminContentLocale, data, reset, staticSection]);

  useEffect(() => {
    if (loading || hasDbRecord || initAttemptedRef.current) return;
    initAttemptedRef.current = true;
    void initializeFromStatic();
  }, [hasDbRecord, initializeFromStatic, loading]);

  const watchValues = watch();
  useEffect(() => {
    setPreviewSection(applyFormToSection(data ?? staticSection, watchValues));
  }, [data, staticSection, watchValues]);

  const sourceLabel = hasDbRecord
    ? getAdminSourceLabel({
        adminLocale,
        contentLocale: adminContentLocale,
        fallbackUsed: adminContentLocale === 'en' && fallbackUsed,
      })
    : content.preview.sourceStatic;

  const onSubmit = async (values: FormValues) => {
    const base = data ?? staticSection;
    const payload = applyFormToSection(base, values);
    const ok = await save(payload);

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

            <div className="rounded-lg border border-white/10 bg-slate-900/30 p-4">
              <h3 className="mb-3 text-sm font-semibold text-white">{content.editor.mainCardsTitle}</h3>
              <div className="space-y-4">
                {previewSection.items.map((item, index) => (
                  <div key={`${item.iconKey}-${index}`} className="rounded-md border border-white/10 p-3">
                    <div className="mb-2 text-xs text-slate-400">{content.editor.cardLabel(index + 1)}</div>
                    <Field label={content.editor.cardTitleLabel} required error={errors.items?.[index]?.title?.message}>
                      <Input {...register(`items.${index}.title`)} />
                    </Field>
                    <Field label={content.editor.cardDescLabel} required error={errors.items?.[index]?.desc?.message}>
                      <Textarea rows={3} {...register(`items.${index}.desc`)} />
                    </Field>
                    <Field
                      label={content.editor.cardBulletsLabel}
                      required
                      hint={content.editor.cardBulletsHint}
                      error={errors.items?.[index]?.bullets?.message}
                    >
                      <Textarea rows={4} {...register(`items.${index}.bullets`)} />
                    </Field>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-slate-900/30 p-4">
              <h3 className="mb-3 text-sm font-semibold text-white">{content.editor.extraCardsTitle}</h3>
              <div className="space-y-4">
                {previewSection.extraItems.map((item, index) => (
                  <div key={`${item.iconKey}-${index}`} className="rounded-md border border-white/10 p-3">
                    <div className="mb-2 text-xs text-slate-400">{content.editor.cardLabel(index + 1)}</div>
                    <Field
                      label={content.editor.cardTitleLabel}
                      required
                      error={errors.extraItems?.[index]?.title?.message}
                    >
                      <Input {...register(`extraItems.${index}.title`)} />
                    </Field>
                    <Field
                      label={content.editor.cardDescLabel}
                      required
                      error={errors.extraItems?.[index]?.desc?.message}
                    >
                      <Textarea rows={2} {...register(`extraItems.${index}.desc`)} />
                    </Field>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" loading={isSubmitting || saving} className="w-full">
              {content.editor.save}
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">{content.preview.title}</h2>
          <div className="space-y-4 rounded-lg border border-white/10 bg-slate-900/50 p-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
              {previewSection.badge}
            </div>
            <h3 className="font-display text-3xl font-bold text-white">
              {previewSection.title} <span className="gradient-text">{previewSection.accentTitle}</span>
            </h3>
            <p className="max-w-2xl text-gray-400">{previewSection.subtitle}</p>

            <div className="space-y-2 pt-2">
              {previewSection.items.map((item, index) => (
                <div key={`${item.iconKey}-preview-${index}`} className="rounded border border-white/10 p-2">
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="text-xs text-slate-300">{item.desc}</div>
                </div>
              ))}
            </div>
            <div className="pt-2 text-xs text-slate-400">{sourceLabel}</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHomeEquipmentSectionPage;
