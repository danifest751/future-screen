import type { ComponentPropsWithoutRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Play } from 'lucide-react';
import EditableImage from '../components/admin/EditableImage';
import Section from '../components/Section';
import { useCases } from '../hooks/useCases';
import type { CaseItem } from '../data/cases';
import { LazyImage } from '../components/LazyImage';
import { useOptionalEditMode } from '../context/EditModeContext';
import { useI18n } from '../context/I18nContext';
import { useEditableBinding } from '../hooks/useEditableBinding';
import { usePageCases } from '../hooks/usePageCases';
import { formatVideoCount, type PageCasesContent } from '../lib/content/pageCases';

type CaseItemWithMedia = CaseItem & { videos?: string[] };

type UpdateCaseFn = (
  slug: string,
  payload: Partial<Omit<CaseItem, 'services'>> & { services?: string[] },
) => Promise<boolean>;

interface CaseCardProps {
  item: CaseItemWithMedia;
  onUpdate: UpdateCaseFn;
  videoOverlay: { watch: string; manyTemplate: string };
}

const CaseCard = ({ item, onUpdate, videoOverlay }: CaseCardProps) => {
  const { isEditing } = useOptionalEditMode();

  const saveField =
    <K extends 'title' | 'city' | 'date' | 'format' | 'summary' | 'metrics'>(field: K) =>
    async (next: string) => {
      const ok = await onUpdate(item.slug, { [field]: next });
      if (!ok) throw new Error(`Failed to save case ${field}`);
    };

  const saveImageAt = (index: number) => async ({ url }: { url: string }) => {
    const nextImages = [...(item.images ?? [])];
    nextImages[index] = url;
    const ok = await onUpdate(item.slug, { images: nextImages });
    if (!ok) throw new Error('Failed to save case image');
  };

  const titleEdit = useEditableBinding({ value: item.title, onSave: saveField('title'), label: 'Case title' });
  const cityEdit = useEditableBinding({ value: item.city, onSave: saveField('city'), label: 'Case city' });
  const dateEdit = useEditableBinding({ value: item.date, onSave: saveField('date'), label: 'Case date' });
  const formatEdit = useEditableBinding({ value: item.format, onSave: saveField('format'), label: 'Case format' });
  const summaryEdit = useEditableBinding({
    value: item.summary,
    onSave: saveField('summary'),
    label: 'Case summary',
    kind: 'multiline',
  });
  const metricsEdit = useEditableBinding({
    value: item.metrics ?? '',
    onSave: saveField('metrics'),
    label: 'Case metrics (comma-separated)',
  });

  const images = item.images || [];
  const videos = item.videos || [];
  const hasVideo = videos.length > 0;
  const previewImages = images.slice(0, 2);

  const wrapperClass = 'card group block overflow-hidden p-0 hover:border-brand-500/40';
  const wrapperProps: ComponentPropsWithoutRef<typeof Link> | ComponentPropsWithoutRef<'div'> = isEditing
    ? { className: wrapperClass }
    : { className: wrapperClass, to: `/cases/${item.slug}` };
  const Wrapper = (isEditing ? 'div' : Link) as typeof Link;

  return (
    <Wrapper {...(wrapperProps as ComponentPropsWithoutRef<typeof Link>)}>
      {previewImages.length > 0 && (
        <div className="relative h-48 overflow-hidden bg-slate-800">
          {previewImages.length === 1 ? (
            <EditableImage
              src={previewImages[0]}
              alt={item.title}
              onSave={saveImageAt(0)}
              label="Case cover image"
            >
              {(src) => (
                <LazyImage
                  src={src}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  placeholderClassName="h-full w-full"
                  containerClassName="h-full w-full"
                />
              )}
            </EditableImage>
          ) : (
            <div className="flex h-full gap-0.5">
              {previewImages.map((src, idx) => (
                <div key={src} className="relative flex-1 overflow-hidden">
                  <EditableImage
                    src={src}
                    alt={`${item.title} ${idx + 1}`}
                    onSave={saveImageAt(idx)}
                    label={`Case image ${idx + 1}`}
                  >
                    {(finalSrc) => (
                      <LazyImage
                        src={finalSrc}
                        alt={`${item.title} ${idx + 1}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        placeholderClassName="h-full w-full"
                        containerClassName="h-full w-full"
                      />
                    )}
                  </EditableImage>
                </div>
              ))}
            </div>
          )}

          {hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
                <Play size={16} fill="currentColor" />
                {videos.length > 1
                  ? formatVideoCount(videoOverlay.manyTemplate, videos.length)
                  : videoOverlay.watch}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded bg-brand-500/10 px-2 py-0.5 text-xs text-brand-300">
            <span {...formatEdit.bindProps}>{formatEdit.value}</span>
          </span>
          <span className="text-xs text-slate-500">
            <span {...cityEdit.bindProps}>{cityEdit.value}</span>
            {' • '}
            <span {...dateEdit.bindProps}>{dateEdit.value}</span>
          </span>
        </div>

        <div className="text-lg font-semibold text-white transition-colors group-hover:text-brand-300">
          <span {...titleEdit.bindProps}>{titleEdit.value}</span>
        </div>

        <p className="mt-1 line-clamp-2 text-sm text-slate-400">
          <span {...summaryEdit.bindProps}>{summaryEdit.value}</span>
        </p>

        {(item.metrics || isEditing) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {isEditing ? (
              <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-xs text-brand-200">
                <span {...metricsEdit.bindProps}>
                  {metricsEdit.value || '— click to add metrics —'}
                </span>
              </span>
            ) : (
              item.metrics?.split(',').map((m, i) => (
                <span
                  key={i}
                  className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-xs text-brand-200"
                >
                  {m.trim()}
                </span>
              ))
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1">
          {item.services.slice(0, 4).map((s, idx) => (
            <span key={s} className="text-[10px] uppercase text-slate-500">
              {s}
              {idx < Math.min(item.services.length, 4) - 1 && (
                <span className="ml-1 text-slate-600">•</span>
              )}
            </span>
          ))}
          {item.services.length > 4 && (
            <span className="text-[10px] text-slate-600">+{item.services.length - 4}</span>
          )}
        </div>
      </div>
    </Wrapper>
  );
};

const CasesPage = () => {
  const { siteLocale } = useI18n();
  const { cases, updateCase } = useCases(siteLocale, false);
  const { data: casesPageContent, save: savePageCases } = usePageCases(siteLocale, true);
  const { seo, section, videoOverlay, emptyState } = casesPageContent;

  const savePagePatch = async (patch: Partial<PageCasesContent>) => {
    const ok = await savePageCases({ ...casesPageContent, ...patch });
    if (!ok) throw new Error('Failed to save cases page content');
  };

  const sectionTitleEdit = useEditableBinding({
    value: section.title,
    onSave: (next) => savePagePatch({ section: { ...section, title: next } }),
    label: 'Cases — section title',
  });
  const sectionSubtitleEdit = useEditableBinding({
    value: section.subtitle,
    onSave: (next) => savePagePatch({ section: { ...section, subtitle: next } }),
    label: 'Cases — section subtitle',
  });

  return (
    <div className="space-y-2">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <Section>
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            <span {...sectionTitleEdit.bindProps}>{sectionTitleEdit.value}</span>
          </h2>
          <p className="text-slate-300 md:text-lg">
            <span {...sectionSubtitleEdit.bindProps}>{sectionSubtitleEdit.value}</span>
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((item) => (
            <CaseCard
              key={item.slug}
              item={item as CaseItemWithMedia}
              onUpdate={updateCase}
              videoOverlay={videoOverlay}
            />
          ))}
        </div>

        {cases.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-slate-800/50 p-12 text-center">
            <div className="text-slate-500">{emptyState}</div>
          </div>
        )}
      </Section>
    </div>
  );
};

export default CasesPage;
