import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { upsertRentalCategory, loadRentalCategories, type RentalCategory } from '../../services/rentalCategories';
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Название обязательно'),
  shortName: z.string().min(2, 'Краткое название обязательно'),
  slug: z.string().min(2, 'Slug обязателен').regex(/^[a-z0-9-]+$/, 'Slug: только латиница, цифры и дефис'),
  isPublished: z.boolean().default(false),
  sortOrder: z.coerce.number().default(0),
  seoTitle: z.string().default(''),
  seoDescription: z.string().default(''),
  heroTitle: z.string().default(''),
  heroSubtitle: z.string().default(''),
  heroShowBlurTitle: z.boolean().default(false),
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

type FormValues = z.infer<typeof schema>;

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
  heroShowBlurTitle: false,
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
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/5"
      >
        <span className="text-lg font-semibold text-white">{title}</span>
        {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>
      {open && <div className="border-t border-white/5 px-5 py-5 space-y-4">{children}</div>}
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
    <label className="block text-sm font-medium text-slate-200 mb-1.5">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none';
const textareaClass = `${inputClass} resize-y`;

const AdminRentalCategoryEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new' || id === undefined;

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

  useUnsavedChangesGuard(isDirty);

  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const all = await loadRentalCategories();
        const cat = all.find((c) => c.id === Number(id));
        if (!cat) {
          toast.error('Категория не найдена');
          navigate('/admin/rental-categories');
          return;
        }
        if (cancelled) return;

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
          heroShowBlurTitle: (cat.hero?.showBlurTitle as boolean) || false,
          heroCtaPrimary: (cat.hero?.ctaPrimary as string) || '',
          heroCtaSecondary: (cat.hero?.ctaSecondary as string) || '',
          heroHighlightsText: highlights.map((h: { text: string }) => h.text).join('\n'),
          aboutTitle: (cat.about?.title as string) || '',
          aboutText: (cat.about?.text as string) || '',
          aboutItemsText: ((cat.about?.items as string[]) || []).join('\n'),
          useCasesTitle: (cat.useCases as any)?.title || '',
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
        toast.error('Ошибка загрузки категории');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, isNew, navigate, reset]);

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
        showBlurTitle: values.heroShowBlurTitle,
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
      await upsertRentalCategory(cat);
      toast.success(isNew ? 'Категория создана' : 'Категория обновлена');
      navigate('/admin/rental-categories');
    } catch {
      toast.error('Ошибка сохранения');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Загрузка..." subtitle="">
        <div className="text-sm text-slate-400">Загрузка данных категории...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={isNew ? 'Новая категория аренды' : `Редактирование: ${watch('name') || '...'}`}
      subtitle={isNew ? 'Создание нового раздела оборудования в аренду' : 'Изменение контента категории'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/rental-categories')}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft size={16} /> Назад
            </button>
            {isDirty && (
              <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                Есть несохраненные изменения
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                {...register('isPublished')}
                className="rounded border-white/20 bg-white/5 text-brand-500"
              />
              Опубликовано
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-60"
            >
              {isSubmitting ? 'Сохраняем...' : isNew ? 'Создать' : 'Сохранить'}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Section title="Основные" defaultOpen>
              <Field label="Название" error={errors.name?.message}>
                <input className={inputClass} {...register('name')} placeholder="Световое оборудование" />
              </Field>
              <Field label="Краткое название" hint="Для карточек на /rent" error={errors.shortName?.message}>
                <input className={inputClass} {...register('shortName')} placeholder="Свет" />
              </Field>
              <Field label="Slug" hint="URL: /rent/{slug}. Только латиница, цифры и дефис" error={errors.slug?.message}>
                <input className={inputClass} {...register('slug')} placeholder="light" />
              </Field>
              <Field label="Порядок сортировки">
                <input type="number" className={inputClass} {...register('sortOrder')} />
              </Field>
            </Section>

            <Section title="SEO">
              <Field label="Meta Title" hint="До 60 символов" error={errors.seoTitle?.message}>
                <input className={inputClass} {...register('seoTitle')} placeholder="Аренда светового оборудования — Фьючер Скрин" />
              </Field>
              <Field label="Meta Description" hint="До 160 символов" error={errors.seoDescription?.message}>
                <textarea className={textareaClass} rows={2} {...register('seoDescription')} placeholder="Профессиональная аренда..." />
              </Field>
            </Section>

            <Section title="Hero-блок">
              <Field label="Заголовок H1" error={errors.heroTitle?.message}>
                <input className={inputClass} {...register('heroTitle')} placeholder="Аренда светового оборудования" />
              </Field>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    {...register('heroShowBlurTitle')}
                    className="rounded border-white/20 bg-white/5 text-brand-500"
                  />
                  Эффект blur-появления заголовка
                </label>
              </div>
              <Field label="Подзаголовок" error={errors.heroSubtitle?.message}>
                <textarea className={textareaClass} rows={2} {...register('heroSubtitle')} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Основной CTA" error={errors.heroCtaPrimary?.message}>
                  <input className={inputClass} {...register('heroCtaPrimary')} placeholder="Запросить КП" />
                </Field>
                <Field label="Вторичный CTA" error={errors.heroCtaSecondary?.message}>
                  <input className={inputClass} {...register('heroCtaSecondary')} placeholder="Подробнее" />
                </Field>
              </div>
              <Field label="Highlights" hint="Каждый пункт с новой строки">
                <textarea className={textareaClass} rows={4} {...register('heroHighlightsText')} placeholder="Быстрая доставка\nНастройка на площадке\nТехподдержка 24/7" />
              </Field>
            </Section>

            <Section title="Описание (About)">
              <Field label="Заголовок секции">
                <input className={inputClass} {...register('aboutTitle')} placeholder="О категории" />
              </Field>
              <Field label="Текст">
                <textarea className={textareaClass} rows={4} {...register('aboutText')} />
              </Field>
              <Field label="Пункты" hint="Каждый пункт с новой строки">
                <textarea className={textareaClass} rows={4} {...register('aboutItemsText')} />
              </Field>
            </Section>

            <Section title="Сценарии использования (Use Cases)">
              <Field label="Заголовок секции">
                <input className={inputClass} {...register('useCasesTitle')} placeholder="Сценарии использования" />
              </Field>
              <Field label="Сценарии" hint="Формат: Заголовок | Описание (каждый с новой строки)">
                <textarea
                  className={textareaClass}
                  rows={8}
                  {...register('useCasesText')}
                  placeholder="Корпоратив | Полное освещение сцены и зала&#10;Концерт | Профессиональный свет для живых выступлений&#10;Выставка | Подсветка стендов и экспозиций"
                />
              </Field>
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Состав услуги (Service Includes)">
              <Field label="Заголовок секции">
                <input className={inputClass} {...register('serviceIncludesTitle')} placeholder="В услугу входит" />
              </Field>
              <Field label="Пункты" hint="Каждый пункт с новой строки">
                <textarea
                  className={textareaClass}
                  rows={6}
                  {...register('serviceIncludesText')}
                  placeholder="Доставка оборудования\nМонтаж и настройка\nТехническое сопровождение\nДемонтаж и вывоз"
                />
              </Field>
            </Section>

            <Section title="Преимущества (Benefits)">
              <Field label="Заголовок секции">
                <input className={inputClass} {...register('benefitsTitle')} placeholder="Почему выбирают нас" />
              </Field>
              <Field label="Преимущества" hint="Формат: Заголовок | Описание (каждый с новой строки)">
                <textarea
                  className={textareaClass}
                  rows={6}
                  {...register('benefitsText')}
                  placeholder="Опыт 15+ лет | Работаем с 2007 года на рынке\nСобственный парк | Не зависим от подрядчиков"
                />
              </Field>
            </Section>

            <Section title="Галерея">
              <Field label="Изображения" hint="Формат: URL | Alt | Подпись (каждый с новой строки)">
                <textarea
                  className={textareaClass}
                  rows={6}
                  {...register('galleryText')}
                  placeholder="/images/rental/light-1.jpg | Свет на сцене | Пример освещения&#10;/images/rental/light-2.jpg | Подсветка зала | Архитектурный свет"
                />
              </Field>
            </Section>

            <Section title="FAQ">
              <Field label="Заголовок секции">
                <input className={inputClass} {...register('faqTitle')} placeholder="Частые вопросы" />
              </Field>
              <Field label="Вопросы и ответы" hint="Формат: Вопрос | Ответ (каждый с новой строки)">
                <textarea
                  className={textareaClass}
                  rows={8}
                  {...register('faqText')}
                  placeholder="Какие сроки аренды? | Минимальный срок — 1 день. Доставка и монтаж включены.&#10;Нужен ли оператор? | Да, мы предоставляем техника на площадке."
                />
              </Field>
            </Section>

            <Section title="CTA внизу страницы">
              <Field label="Заголовок">
                <input className={inputClass} {...register('bottomCtaTitle')} placeholder="Готовы обсудить проект?" />
              </Field>
              <Field label="Текст">
                <textarea className={textareaClass} rows={2} {...register('bottomCtaText')} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Основной CTA">
                  <input className={inputClass} {...register('bottomCtaPrimary')} placeholder="Запросить КП" />
                </Field>
                <Field label="Вторичный CTA">
                  <input className={inputClass} {...register('bottomCtaSecondary')} placeholder="Позвонить" />
                </Field>
              </div>
            </Section>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => navigate('/admin/rental-categories')}
            className="rounded-lg border border-white/10 px-5 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-60"
          >
            {isSubmitting ? 'Сохраняем...' : isNew ? 'Создать категорию' : 'Сохранить изменения'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AdminRentalCategoryEditPage;
