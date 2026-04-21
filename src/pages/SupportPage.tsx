import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import EditableList from '../components/admin/EditableList';
import { RequestForm } from '../components/RequestForm';
import Section from '../components/Section';
import { useI18n } from '../context/I18nContext';
import { useEditableBinding } from '../hooks/useEditableBinding';
import { usePackages } from '../hooks/usePackages';
import { usePageSupport } from '../hooks/usePageSupport';

const SupportPage = () => {
  const { siteLocale } = useI18n();
  const { packages, loading } = usePackages(siteLocale, false);
  const { data, save } = usePageSupport(siteLocale, true);

  const savePatch = async (patch: Partial<typeof data>) => {
    const ok = await save({ ...data, ...patch });
    if (!ok) throw new Error('Failed to save Support content');
  };

  const heroTitleEdit = useEditableBinding({
    value: data.hero.title,
    onSave: (next) => savePatch({ hero: { ...data.hero, title: next } }),
    label: 'Support — hero title',
  });
  const heroSubtitleEdit = useEditableBinding({
    value: data.hero.subtitle,
    onSave: (next) => savePatch({ hero: { ...data.hero, subtitle: next } }),
    label: 'Support — hero subtitle',
  });
  const processTitleEdit = useEditableBinding({
    value: data.process.title,
    onSave: (next) => savePatch({ process: { ...data.process, title: next } }),
    label: 'Support — process title',
  });
  const processSubtitleEdit = useEditableBinding({
    value: data.process.subtitle,
    onSave: (next) => savePatch({ process: { ...data.process, subtitle: next } }),
    label: 'Support — process subtitle',
  });
  const advantagesTitleEdit = useEditableBinding({
    value: data.advantages.title,
    onSave: (next) => savePatch({ advantages: { ...data.advantages, title: next } }),
    label: 'Support — advantages title',
  });

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
        <div className="grid gap-4 md:grid-cols-3">
          {loading || packages.length === 0 ? (
            <div className="col-span-3 text-center text-slate-400">{data.loading}</div>
          ) : (
            packages.map((pack) => (
              <div key={pack.id} className="card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-semibold text-white">{pack.name}</div>
                  <div className="badge">{pack.forFormats?.[0] || data.universalBadge}</div>
                </div>
                <div className="text-sm text-slate-300">{pack.priceHint}</div>
                <ul className="space-y-2 text-sm text-slate-200">
                  {pack.includes?.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {pack.options ? (
                  <div className="text-xs text-slate-400">
                    {data.optionsPrefix} {pack.options.join(', ')}
                  </div>
                ) : null}
                <div className="text-xs text-slate-400">
                  {data.formatsPrefix} {pack.forFormats?.join(' • ') || '—'}
                </div>
                <Link
                  to="/consult"
                  className="mt-auto inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
                >
                  {data.discussPackage}
                </Link>
              </div>
            ))
          )}
        </div>
      </Section>

      <Section>
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            <span {...processTitleEdit.bindProps}>{processTitleEdit.value}</span>
          </h2>
          <p className="text-slate-300 md:text-lg">
            <span {...processSubtitleEdit.bindProps}>{processSubtitleEdit.value}</span>
          </p>
        </div>
        <EditableList
          items={data.process.items}
          onSave={(next) => savePatch({ process: { ...data.process, items: next } })}
          label="Support — process steps"
          placeholder="One step per line"
        >
          <div className="grid gap-3 md:grid-cols-3">
            {data.process.items.map((item, index) => (
              <div key={`${index}-${item.slice(0, 16)}`} className="card">
                <div className="text-sm text-slate-400">
                  {data.process.stepPrefix} {index + 1}
                </div>
                <div className="mt-1 text-lg font-semibold text-white">{item}</div>
              </div>
            ))}
          </div>
        </EditableList>
      </Section>

      <Section className="pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card space-y-3">
            <div className="text-lg font-semibold text-white">
              <span {...advantagesTitleEdit.bindProps}>{advantagesTitleEdit.value}</span>
            </div>
            <EditableList
              items={data.advantages.items}
              onSave={(next) => savePatch({ advantages: { ...data.advantages, items: next } })}
              label="Support — advantages items"
              placeholder="One advantage per line"
            >
              <ul className="space-y-2 text-sm text-slate-200">
                {data.advantages.items.map((item, i) => (
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

export default SupportPage;
