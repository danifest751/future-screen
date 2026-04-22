import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import EditableList from '../components/admin/EditableList';
import { RequestForm } from '../components/RequestForm';
import { useI18n } from '../context/I18nContext';
import { useEditableBinding } from '../hooks/useEditableBinding';
import { usePageConsult } from '../hooks/usePageConsult';
import type { PageConsultContent } from '../lib/content/pageConsult';

const ConsultPage = () => {
  const { siteLocale } = useI18n();
  const { data, save } = usePageConsult(siteLocale, true);

  const savePatch = async (patch: Partial<PageConsultContent>) => {
    const ok = await save({ ...data, ...patch });
    if (!ok) throw new Error('Failed to save Consult content');
  };

  const heroTitleEdit = useEditableBinding({
    value: data.hero.title,
    onSave: (next) => savePatch({ hero: { ...data.hero, title: next } }),
    label: 'Consult — hero title',
  });
  const heroSubtitleEdit = useEditableBinding({
    value: data.hero.subtitle,
    onSave: (next) => savePatch({ hero: { ...data.hero, subtitle: next } }),
    label: 'Consult — hero subtitle',
  });
  const bodyDescriptionEdit = useEditableBinding({
    value: data.body.description,
    onSave: (next) => savePatch({ body: { ...data.body, description: next } }),
    label: 'Consult — body description',
    kind: 'multiline',
  });
  // form.title / form.subtitle / form.ctaText stay DB-backed but are
  // rendered inside RequestForm as plain strings — they're not inline-
  // editable because RequestForm receives them as props (admin edits via
  // the DB record directly or a future admin UI).

  return (
    <div className="space-y-2">
      <Helmet>
        <title>{data.seo.title}</title>
        <meta name="description" content={data.seo.description} />
      </Helmet>
      <Section>
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            <span {...heroTitleEdit.bindProps}>{heroTitleEdit.value}</span>
          </h2>
          <p className="text-slate-300 md:text-lg">
            <span {...heroSubtitleEdit.bindProps}>{heroSubtitleEdit.value}</span>
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card space-y-3 text-sm text-slate-200">
            <p>
              <span {...bodyDescriptionEdit.bindProps}>{bodyDescriptionEdit.value}</span>
            </p>
            <EditableList
              items={data.body.items}
              onSave={(next) => savePatch({ body: { ...data.body, items: next } })}
              label="Consult — body items"
              placeholder="One item per line"
            >
              <ul className="space-y-2">
                {data.body.items.map((item, i) => (
                  <li key={`${i}-${item.slice(0, 16)}`} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </EditableList>
          </div>
          <RequestForm
            title={data.form.title}
            subtitle={data.form.subtitle}
            ctaText={data.form.ctaText}
          />
        </div>
      </Section>
    </div>
  );
};

export default ConsultPage;
