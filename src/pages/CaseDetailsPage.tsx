import { Link, Navigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import EditableList from '../components/admin/EditableList';
import Section from '../components/Section';
import { useCases } from '../hooks/useCases';
import { RequestForm } from '../components/RequestForm';
import { trackEvent } from '../lib/analytics';
import type { CaseItem } from '../data/cases';
import { useOptionalEditMode } from '../context/EditModeContext';
import { useI18n } from '../context/I18nContext';
import { useEditableBinding } from '../hooks/useEditableBinding';
import { usePageCases } from '../hooks/usePageCases';
import type { PageCasesContent } from '../lib/content/pageCases';

const CaseDetailsPage = () => {
  const { siteLocale } = useI18n();
  const { isEditing } = useOptionalEditMode();
  const { slug } = useParams();
  const { cases, updateCase } = useCases(siteLocale, false);
  const item = cases.find((c) => c.slug === slug);
  const { data: casesPageContent, save: savePageCases } = usePageCases(siteLocale, true);
  const { details } = casesPageContent;

  const savePageDetailsField = (field: keyof PageCasesContent['details']) => async (next: string) => {
    const ok = await savePageCases({
      ...casesPageContent,
      details: { ...casesPageContent.details, [field]: next },
    });
    if (!ok) throw new Error('Failed to save cases details');
  };

  const servicesLabelEdit = useEditableBinding({
    value: details.servicesLabel,
    onSave: savePageDetailsField('servicesLabel'),
    label: 'Case details — services label',
  });
  const videosLabelEdit = useEditableBinding({
    value: details.videosLabel,
    onSave: savePageDetailsField('videosLabel'),
    label: 'Case details — videos label',
  });
  const contactPromptEdit = useEditableBinding({
    value: details.contactPrompt,
    onSave: savePageDetailsField('contactPrompt'),
    label: 'Case details — contact prompt',
  });
  const contactLinkEdit = useEditableBinding({
    value: details.contactLink,
    onSave: savePageDetailsField('contactLink'),
    label: 'Case details — contact link text',
  });

  const saveField =
    <K extends 'title' | 'city' | 'date' | 'format' | 'summary' | 'metrics'>(field: K) =>
    async (next: string) => {
      if (!item) throw new Error('Case not loaded');
      const ok = await updateCase(item.slug, { [field]: next });
      if (!ok) throw new Error(`Case ${field} save failed`);
    };

  const saveServices = async (next: string[]) => {
    if (!item) throw new Error('Case not loaded');
    const ok = await updateCase(item.slug, { services: next });
    if (!ok) throw new Error('Case services save failed');
  };

  const titleEdit = useEditableBinding({
    value: item?.title ?? '',
    onSave: saveField('title'),
    label: 'Case title',
    disabled: !item,
  });
  const cityEdit = useEditableBinding({
    value: item?.city ?? '',
    onSave: saveField('city'),
    label: 'Case city',
    disabled: !item,
  });
  const dateEdit = useEditableBinding({
    value: item?.date ?? '',
    onSave: saveField('date'),
    label: 'Case date',
    disabled: !item,
  });
  const formatEdit = useEditableBinding({
    value: item?.format ?? '',
    onSave: saveField('format'),
    label: 'Case format',
    disabled: !item,
  });
  const summaryEdit = useEditableBinding({
    value: item?.summary ?? '',
    onSave: saveField('summary'),
    label: 'Case summary',
    kind: 'multiline',
    disabled: !item,
  });
  const metricsEdit = useEditableBinding({
    value: item?.metrics ?? '',
    onSave: saveField('metrics'),
    label: 'Case metrics',
    disabled: !item,
  });

  useEffect(() => {
    if (item) {
      trackEvent('view_case', { slug: item.slug });
    }
  }, [item]);

  if (!item) return <Navigate to="/cases" replace />;

  return (
    <div className="space-y-2">
      <Helmet>
        <title>{`${item.title} ${details.titleSuffix}`}</title>
        <meta name="description" content={item.summary} />
      </Helmet>
      <Section>
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            <span {...titleEdit.bindProps}>{titleEdit.value}</span>
          </h2>
          <p className="text-slate-300 md:text-lg">
            <span {...cityEdit.bindProps}>{cityEdit.value}</span>
            {' • '}
            <span {...dateEdit.bindProps}>{dateEdit.value}</span>
            {' • '}
            <span {...formatEdit.bindProps}>{formatEdit.value}</span>
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card md:col-span-2">
            <div className="text-sm text-slate-400">
              <span {...servicesLabelEdit.bindProps}>{servicesLabelEdit.value}</span>{' '}
              <EditableList
                items={item.services}
                onSave={saveServices}
                label="Case services"
                placeholder="LED"
              >
                <span>{item.services.join(', ')}</span>
              </EditableList>
            </div>
            <p className="mt-2 text-slate-200">
              <span {...summaryEdit.bindProps}>{summaryEdit.value}</span>
            </p>
            {(item.metrics || isEditing) && (
              <div className="mt-3 text-sm text-brand-100">
                <span {...metricsEdit.bindProps}>
                  {metricsEdit.value || '— click to add metrics —'}
                </span>
              </div>
            )}
            {item.images && item.images.length > 0 && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {item.images.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt={item.title}
                    className="h-40 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            {(item as CaseItem & { videos?: string[] }).videos && (item as CaseItem & { videos?: string[] }).videos!.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="text-sm text-slate-400">
                  <span {...videosLabelEdit.bindProps}>{videosLabelEdit.value}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {(item as CaseItem & { videos?: string[] }).videos!.map((src) => (
                    <video
                      key={src}
                      src={src}
                      controls
                      className="h-48 w-full rounded-xl object-cover"
                      preload="metadata"
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 text-sm text-slate-400">
              <span {...contactPromptEdit.bindProps}>{contactPromptEdit.value}</span>{' '}
              <Link to="/contacts" className="text-brand-200 hover:text-brand-100">
                <span {...contactLinkEdit.bindProps}>{contactLinkEdit.value}</span>
              </Link>
            </div>
          </div>
          <RequestForm title={details.requestTitle} subtitle={details.requestSubtitle} ctaText={details.requestCta} />
        </div>
      </Section>
    </div>
  );
};

export default CaseDetailsPage;
