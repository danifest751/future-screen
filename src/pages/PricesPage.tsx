import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import EditableList from '../components/admin/EditableList';
import { usePackages } from '../hooks/usePackages';
import { RequestForm } from '../components/RequestForm';
import { useI18n } from '../context/I18nContext';
import { useEditableBinding } from '../hooks/useEditableBinding';
import { usePagePrices } from '../hooks/usePagePrices';
import type { PagePricesContent } from '../lib/content/pagePrices';

const PricesPage = () => {
  const { siteLocale } = useI18n();
  const { packages, loading } = usePackages(siteLocale, false);
  const { data, save } = usePagePrices(siteLocale, true);

  const savePatch = async (patch: Partial<PagePricesContent>) => {
    const ok = await save({ ...data, ...patch });
    if (!ok) throw new Error('Failed to save Prices content');
  };

  const heroTitleEdit = useEditableBinding({
    value: data.hero.title,
    onSave: (next) => savePatch({ hero: { ...data.hero, title: next } }),
    label: 'Prices — hero title',
  });
  const heroSubtitleEdit = useEditableBinding({
    value: data.hero.subtitle,
    onSave: (next) => savePatch({ hero: { ...data.hero, subtitle: next } }),
    label: 'Prices — hero subtitle',
  });
  const pricingTitleEdit = useEditableBinding({
    value: data.pricing.title,
    onSave: (next) => savePatch({ pricing: { ...data.pricing, title: next } }),
    label: 'Prices — pricing block title',
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
            <div className="col-span-3 text-center text-slate-400">{data.hero.loading}</div>
          ) : (
            packages.map((pack) => (
              <div key={pack.id} className="card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-semibold text-white">{pack.name}</div>
                  <div className="badge">{pack.forFormats?.[0] || data.hero.fallbackFormat}</div>
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
                {pack.options && (
                  <div className="text-xs text-slate-400">
                    {data.hero.optionsLabel} {pack.options.join(', ')}
                  </div>
                )}
                <Link
                  to="/support"
                  className="mt-auto inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
                >
                  {data.hero.detailsLink}
                </Link>
              </div>
            ))
          )}
        </div>
      </Section>

      <Section className="pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card space-y-3">
            <div className="text-lg font-semibold text-white">
              <span {...pricingTitleEdit.bindProps}>{pricingTitleEdit.value}</span>
            </div>
            <EditableList
              items={data.pricing.items}
              onSave={(next) => savePatch({ pricing: { ...data.pricing, items: next } })}
              label="Prices — pricing items"
              placeholder="One item per line"
            >
              <ul className="space-y-2 text-sm text-slate-200">
                {data.pricing.items.map((item, i) => (
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

export default PricesPage;
