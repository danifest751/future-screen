import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { upsertRentalCategory, loadRentalCategories, type RentalCategory } from '../../services/rentalCategories';
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { getAdminRentalCategoryEditContent } from '../../content/pages/adminRentalCategoryEdit';
import { FallbackDot } from '../../components/admin/ui';
import { getAdminSourceLabel } from '../../lib/i18n/adminSourceLabel';

const createSchema = (content: ReturnType<typeof getAdminRentalCategoryEditContent>) =>
  z.object({
    name: z.string().min(2, content.validation.nameRequired),
    shortName: z.string().min(2, content.validation.shortNameRequired),
    slug: z
      .string()
      .min(2, content.validation.slugRequired)
      .regex(/^[a-z0-9-]+$/, content.validation.slugFormat),
    isPublished: z.boolean().default(false),
    sortOrder: z.coerce.number().default(0),
    seoTitle: z.string().default(''),
    seoDescription: z.string().default(''),
    heroTitle: z.string().default(''),
    heroSubtitle: z.string().default(''),
    heroCtaPrimary: z.string().default(''),
    heroCtaSecondary: z.string().default(''),
    heroHighlightsText: z.string().default(''),
    aboutTitle: z.string().default(''),
    aboutText: z.string().default(''),
    aboutItemsText: z.string().default(''),
    useCasesTitle: z.string().default(''),
    useCasesText: z.string().default(''),
    serviceIncludesTitle: z.string().default(''),
    serviceIncludesText: z.string().default(''),
    benefitsTitle: z.string().default(''),
    benefitsText: z.string().default(''),
    galleryText: z.string().default(''),
    faqTitle: z.string().default(''),
    faqText: z.string().default(''),
    bottomCtaTitle: z.string().default(''),
    bottomCtaText: z.string().default(''),
    bottomCtaPrimary: z.string().default(''),
    bottomCtaSecondary: z.string().default(''),
  });

type FormValues = z.infer<ReturnType<typeof createSchema>>;

const defaultValues: FormValues = {
  name: '',
  shortName: '',
  slug: '',
  isPublished: false,
  sortOrder: 0,
  seoTitle: '',
  seoDescription: '',
  heroTitle: '',
  heroSubtitle: '',
  heroCtaPrimary: '',
  heroCtaSecondary: '',
  heroHighlightsText: '',
  aboutTitle: '',
  aboutText: '',
  aboutItemsText: '',
  useCasesTitle: '',
  useCasesText: '',
  serviceIncludesTitle: '',
  serviceIncludesText: '',
  benefitsTitle: '',
  benefitsText: '',
  galleryText: '',
  faqTitle: '',
  faqText: '',
  bottomCtaTitle: '',
  bottomCtaText: '',
  bottomCtaPrimary: '',
  bottomCtaSecondary: '',
};

const parseLines = (text: string) =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

const Section = ({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/5"
      >
        <span className="text-base font-semibold text-white">{title}</span>
        {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>
      {open && <div className="space-y-3 border-t border-white/5 px-4 py-4">{children}</div>}
    </div>
  );
};

const Field = ({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-slate-200">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none';
const textareaClass = `${inputClass} resize-y`;

const AdminRentalCategoryEditPage = () => {
  const { adminLocale, adminContentLocale, setAdminContentLocale } = useI18n();
  const adminRentalCategoryEditContent = getAdminRentalCategoryEditContent(adminLocale);
  const schema = useMemo(() => createSchema(adminRentalCategoryEditContent), [adminRentalCategoryEditContent]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new' || id === undefined;

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

  useUnsavedChangesGuard(isDirty);

  const [loading, setLoading] = useState(!isNew);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  const sourceLabel = getAdminSourceLabel({
    adminLocale,
    contentLocale: adminContentLocale,
    fallbackUsed: !isNew && adminContentLocale === 'en' && fallbackUsed,
  });

  useEffect(() => {
    if (isNew) {
      setFallbackUsed(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setFallbackUsed(false);
      try {
        const all = await loadRentalCategories(adminContentLocale, false);
        const cat = all.find((c) => c.id === Number(id));
        if (!cat) {
          toast.error(adminRentalCategoryEditContent.toasts.notFound);
          navigate('/admin/rental-categories');
          return;
        }
        if (cancelled) return;
        setFallbackUsed(!!cat.isFallbackFromRu);

        const highlights = (cat.hero.highlights as Array<{ text: string }>) || [];
        const useCases = cat.useCases || [];
        const benefits = cat.benefits?.items || [];
        const faqItems = cat.faq?.items || [];
        const gallery = cat.gallery || [];

        reset({
          name: cat.name,
          shortName: cat.shortName,
          slug: cat.slug,
          isPublished: cat.isPublished,
          sortOrder: cat.sortOrder,
          seoTitle: (cat.seo?.title as string) || '',
          seoDescription: (cat.seo?.description as string) || '',
          heroTitle: (cat.hero?.title as string) || '',
          heroSubtitle: (cat.hero?.subtitle as string) || '',
          heroCtaPrimary: (cat.hero?.ctaPrimary as string) || '',
          heroCtaSecondary: (cat.hero?.ctaSecondary as string) || '',
          heroHighlightsText: highlights.map((h: { text: string }) => h.text).join('\n'),
          aboutTitle: (cat.about?.title as string) || '',
          aboutText: (cat.about?.text as string) || '',
          aboutItemsText: ((cat.about?.items as string[]) || []).join('\n'),
          useCasesTitle: (cat.useCases as { title?: string })?.title || '',
          useCasesText: useCases
            .map((uc: { title: string; description: string }) => `${uc.title} | ${uc.description}`)
            .join('\n'),
          serviceIncludesTitle: cat.serviceIncludes?.title || '',
          serviceIncludesText: (cat.serviceIncludes?.items || []).join('\n'),
          benefitsTitle: cat.benefits?.title || '',
          benefitsText: benefits
            .map((b: { title: string; description: string }) => `${b.title} | ${b.description}`)
            .join('\n'),
          galleryText: gallery
            .map((g: { image: string; alt: string; caption: string }) => `${g.image} | ${g.alt} | ${g.caption}`)
            .join('\n'),
          faqTitle: cat.faq?.title || '',
          faqText: faqItems
            .map((f: { question: string; answer: string }) => `${f.question} | ${f.answer}`)
            .join('\n'),
          bottomCtaTitle: (cat.bottomCta?.title as string) || '',
          bottomCtaText: (cat.bottomCta?.text as string) || '',
          bottomCtaPrimary: (cat.bottomCta?.primaryCta as string) || '',
          bottomCtaSecondary: (cat.bottomCta?.secondaryCta as string) || '',
        });
      } catch {
        toast.error(adminRentalCategoryEditContent.toasts.loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, isNew, navigate, reset, adminContentLocale, adminRentalCategoryEditContent.toasts.loadError, adminRentalCategoryEditContent.toasts.notFound]);

  const onSubmit = async (values: FormValues) => {
    const highlights = parseLines(values.heroHighlightsText || '').map((text) => ({ text }));
    const useCases = parseLines(values.useCasesText || '').map((line) => {
      const [title, description] = line.split('|').map((s) => s.trim());
      return { title: title || '', description: description || '' };
    });
    const benefits = parseLines(values.benefitsText || '').map((line) => {
      const [title, description] = line.split('|').map((s) => s.trim());
      return { title: title || '', description: description || '' };
    });
    const faqItems = parseLines(values.faqText || '').map((line) => {
      const [question, answer] = line.split('|').map((s) => s.trim());
      return { question: question || '', answer: answer || '' };
    });
    const gallery = parseLines(values.galleryText || '').map((line) => {
      const parts = line.split('|').map((s) => s.trim());
      return { image: parts[0] || '', alt: parts[1] || '', caption: parts[2] || '' };
    });

    const cat: RentalCategory = {
      id: isNew ? 0 : Number(id),
      slug: values.slug,
      name: values.name,
      shortName: values.shortName,
      isPublished: values.isPublished,
      sortOrder: values.sortOrder,
      seo: {
        title: values.seoTitle,
        description: values.seoDescription,
      },
      hero: {
        title: values.heroTitle,
        subtitle: values.heroSubtitle,
        ctaPrimary: values.heroCtaPrimary,
        ctaSecondary: values.heroCtaSecondary,
        highlights,
      },
      about: {
        title: values.aboutTitle,
        text: values.aboutText,
        items: parseLines(values.aboutItemsText || ''),
      },
      useCases,
      serviceIncludes: {
        title: values.serviceIncludesTitle,
        items: parseLines(values.serviceIncludesText || ''),
      },
      benefits: {
        title: values.benefitsTitle,
        items: benefits,
      },
      gallery,
      faq: {
        title: values.faqTitle,
        items: faqItems,
      },
      bottomCta: {
        title: values.bottomCtaTitle,
        text: values.bottomCtaText,
        primaryCta: values.bottomCtaPrimary,
        secondaryCta: values.bottomCtaSecondary,
      },
    };

    try {
      await upsertRentalCategory(cat, adminContentLocale);
      toast.success(isNew ? adminRentalCategoryEditContent.toasts.createSuccess : adminRentalCategoryEditContent.toasts.updateSuccess);
      navigate('/admin/rental-categories');
    } catch {
      toast.error(adminRentalCategoryEditContent.toasts.saveError);
    }
  };

  if (loading) {
    return (
      <AdminLayout
        title={adminRentalCategoryEditContent.loading.title}
        subtitle=""
        contentLocale={adminContentLocale}
        onContentLocaleChange={setAdminContentLocale}
      >
        <div className="text-sm text-slate-400">{adminRentalCategoryEditContent.loading.description}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={
        isNew
          ? adminRentalCategoryEditContent.layout.createTitle
          : adminRentalCategoryEditContent.layout.editTitle(
            watch('name') || adminRentalCategoryEditContent.layout.unknownName,
          )
      }
      subtitle={
        isNew
          ? adminRentalCategoryEditContent.layout.createSubtitle
          : adminRentalCategoryEditContent.layout.editSubtitle
      }
      contentLocale={adminContentLocale}
      onContentLocaleChange={setAdminContentLocale}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/95 px-4 py-3 shadow-xl shadow-black/20 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/rental-categories')}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft size={16} /> {adminRentalCategoryEditContent.topBar.back}
            </button>
            <FallbackDot visible={!isNew && adminContentLocale === 'en' && fallbackUsed} adminLocale={adminLocale} />
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-slate-300">
              {sourceLabel}
            </span>
            {isDirty && (
              <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                {adminRentalCategoryEditContent.topBar.unsaved}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                {...register('isPublished')}
                className="rounded border-white/20 bg-white/5 text-brand-500"
              />
              {adminRentalCategoryEditContent.topBar.published}
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-60"
            >
              {isSubmitting
                ? adminRentalCategoryEditContent.topBar.saving
                : isNew
                  ? adminRentalCategoryEditContent.topBar.create
                  : adminRentalCategoryEditContent.topBar.save}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Section title={adminRentalCategoryEditContent.sections.basics.title} defaultOpen>
              <Field label={adminRentalCategoryEditContent.sections.basics.name} error={errors.name?.message}>
                <input className={inputClass} {...register('name')} placeholder={adminRentalCategoryEditContent.sections.basics.namePlaceholder} />
              </Field>
              <Field
                label={adminRentalCategoryEditContent.sections.basics.shortName}
                hint={adminRentalCategoryEditContent.sections.basics.shortNameHint}
                error={errors.shortName?.message}
              >
                <input className={inputClass} {...register('shortName')} placeholder={adminRentalCategoryEditContent.sections.basics.shortNamePlaceholder} />
              </Field>
              <Field
                label={adminRentalCategoryEditContent.sections.basics.slug}
                hint={adminRentalCategoryEditContent.sections.basics.slugHint}
                error={errors.slug?.message}
              >
                <input className={inputClass} {...register('slug')} placeholder={adminRentalCategoryEditContent.sections.basics.slugPlaceholder} />
              </Field>
              <Field label={adminRentalCategoryEditContent.sections.basics.sortOrder}>
                <input type="number" className={inputClass} {...register('sortOrder')} />
              </Field>
            </Section>

            <Section title={adminRentalCategoryEditContent.sections.seo.title}>
              <Field
                label={adminRentalCategoryEditContent.sections.seo.metaTitle}
                hint={adminRentalCategoryEditContent.sections.seo.metaTitleHint}
                error={errors.seoTitle?.message}
              >
                <input className={inputClass} {...register('seoTitle')} placeholder={adminRentalCategoryEditContent.sections.seo.metaTitlePlaceholder} />
              </Field>
              <Field
                label={adminRentalCategoryEditContent.sections.seo.metaDescription}
                hint={adminRentalCategoryEditContent.sections.seo.metaDescriptionHint}
                error={errors.seoDescription?.message}
              >
                <textarea className={textareaClass} rows={2} {...register('seoDescription')} placeholder={adminRentalCategoryEditContent.sections.seo.metaDescriptionPlaceholder} />
              </Field>
            </Section>

            <Section title={adminRentalCategoryEditContent.sections.hero.title}>
              <Field label={adminRentalCategoryEditContent.sections.hero.h1} error={errors.heroTitle?.message}>
                <input className={inputClass} {...register('heroTitle')} placeholder={adminRentalCategoryEditContent.sections.hero.h1Placeholder} />
              </Field>
              <Field label={adminRentalCategoryEditContent.sections.hero.subtitle} error={errors.heroSubtitle?.message}>
                <textarea className={textareaClass} rows={2} {...register('heroSubtitle')} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={adminRentalCategoryEditContent.sections.hero.ctaPrimary} error={errors.heroCtaPrimary?.message}>
                  <input className={inputClass} {...register('heroCtaPrimary')} placeholder={adminRentalCategoryEditContent.sections.hero.ctaPrimaryPlaceholder} />
                </Field>
                <Field label={adminRentalCategoryEditContent.sections.hero.ctaSecondary} error={errors.heroCtaSecondary?.message}>
                  <input className={inputClass} {...register('heroCtaSecondary')} placeholder={adminRentalCategoryEditContent.sections.hero.ctaSecondaryPlaceholder} />
                </Field>
              </div>
              <Field label={adminRentalCategoryEditContent.sections.hero.highlights} hint={adminRentalCategoryEditContent.sections.hero.highlightsHint}>
                <textarea className={textareaClass} rows={3} {...register('heroHighlightsText')} placeholder={adminRentalCategoryEditContent.sections.hero.highlightsPlaceholder} />
              </Field>
            </Section>

            <Section title={adminRentalCategoryEditContent.sections.about.title}>
              <Field label={adminRentalCategoryEditContent.sections.about.sectionTitle}>
                <input className={inputClass} {...register('aboutTitle')} placeholder={adminRentalCategoryEditContent.sections.about.sectionTitlePlaceholder} />
              </Field>
              <Field label={adminRentalCategoryEditContent.sections.about.text}>
                <textarea className={textareaClass} rows={3} {...register('aboutText')} />
              </Field>
              <Field label={adminRentalCategoryEditContent.sections.about.items} hint={adminRentalCategoryEditContent.sections.about.itemsHint}>
                <textarea className={textareaClass} rows={3} {...register('aboutItemsText')} />
              </Field>
            </Section>

            <Section title={adminRentalCategoryEditContent.sections.useCases.title}>
              <Field label={adminRentalCategoryEditContent.sections.useCases.sectionTitle}>
                <input className={inputClass} {...register('useCasesTitle')} placeholder={adminRentalCategoryEditContent.sections.useCases.sectionTitlePlaceholder} />
              </Field>
              <Field label={adminRentalCategoryEditContent.sections.useCases.rows} hint={adminRentalCategoryEditContent.sections.useCases.rowsHint}>
                <textarea
                  className={textareaClass}
                  rows={5}
                  {...register('useCasesText')}
                  placeholder={adminRentalCategoryEditContent.sections.useCases.rowsPlaceholder}
                />
              </Field>
            </Section>
          </div>

          <div className="space-y-4">
            <Section title={adminRentalCategoryEditContent.sections.serviceIncludes.title}>
              <Field label={adminRentalCategoryEditContent.sections.serviceIncludes.sectionTitle}>
                <input className={inputClass} {...register('serviceIncludesTitle')} placeholder={adminRentalCategoryEditContent.sections.serviceIncludes.sectionTitlePlaceholder} />
              </Field>
              <Field label={adminRentalCategoryEditContent.sections.serviceIncludes.items} hint={adminRentalCategoryEditContent.sections.serviceIncludes.itemsHint}>
                <textarea
                  className={textareaClass}
                  rows={4}
                  {...register('serviceIncludesText')}
                  placeholder={adminRentalCategoryEditContent.sections.serviceIncludes.itemsPlaceholder}
                />
              </Field>
            </Section>

            <Section title={adminRentalCategoryEditContent.sections.benefits.title}>
              <Field label={adminRentalCategoryEditContent.sections.benefits.sectionTitle}>
                <input className={inputClass} {...register('benefitsTitle')} placeholder={adminRentalCategoryEditContent.sections.benefits.sectionTitlePlaceholder} />
              </Field>
              <Field label={adminRentalCategoryEditContent.sections.benefits.rows} hint={adminRentalCategoryEditContent.sections.benefits.rowsHint}>
                <textarea
                  className={textareaClass}
                  rows={4}
                  {...register('benefitsText')}
                  placeholder={adminRentalCategoryEditContent.sections.benefits.rowsPlaceholder}
                />
              </Field>
            </Section>

            <Section title={adminRentalCategoryEditContent.sections.gallery.title}>
              <Field label={adminRentalCategoryEditContent.sections.gallery.rows} hint={adminRentalCategoryEditContent.sections.gallery.rowsHint}>
                <textarea
                  className={textareaClass}
                  rows={4}
                  {...register('galleryText')}
                  placeholder={adminRentalCategoryEditContent.sections.gallery.rowsPlaceholder}
                />
              </Field>
            </Section>

            <Section title={adminRentalCategoryEditContent.sections.faq.title}>
              <Field label={adminRentalCategoryEditContent.sections.faq.sectionTitle}>
                <input className={inputClass} {...register('faqTitle')} placeholder={adminRentalCategoryEditContent.sections.faq.sectionTitlePlaceholder} />
              </Field>
              <Field label={adminRentalCategoryEditContent.sections.faq.rows} hint={adminRentalCategoryEditContent.sections.faq.rowsHint}>
                <textarea
                  className={textareaClass}
                  rows={5}
                  {...register('faqText')}
                  placeholder={adminRentalCategoryEditContent.sections.faq.rowsPlaceholder}
                />
              </Field>
            </Section>

            <Section title={adminRentalCategoryEditContent.sections.bottomCta.title}>
              <Field label={adminRentalCategoryEditContent.sections.bottomCta.heading}>
                <input className={inputClass} {...register('bottomCtaTitle')} placeholder={adminRentalCategoryEditContent.sections.bottomCta.headingPlaceholder} />
              </Field>
              <Field label={adminRentalCategoryEditContent.sections.bottomCta.text}>
                <textarea className={textareaClass} rows={2} {...register('bottomCtaText')} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={adminRentalCategoryEditContent.sections.bottomCta.primary}>
                  <input className={inputClass} {...register('bottomCtaPrimary')} placeholder={adminRentalCategoryEditContent.sections.bottomCta.primaryPlaceholder} />
                </Field>
                <Field label={adminRentalCategoryEditContent.sections.bottomCta.secondary}>
                  <input className={inputClass} {...register('bottomCtaSecondary')} placeholder={adminRentalCategoryEditContent.sections.bottomCta.secondaryPlaceholder} />
                </Field>
              </div>
            </Section>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => navigate('/admin/rental-categories')}
            className="rounded-lg border border-white/10 px-4 py-1.5 text-sm text-slate-300 hover:bg-white/5"
          >
            {adminRentalCategoryEditContent.footer.cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-60"
          >
            {isSubmitting
              ? adminRentalCategoryEditContent.footer.saving
              : isNew
                ? adminRentalCategoryEditContent.footer.create
                : adminRentalCategoryEditContent.footer.save}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AdminRentalCategoryEditPage;
