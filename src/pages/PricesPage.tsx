import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { usePackages } from '../hooks/usePackages';
import { RequestForm } from '../components/RequestForm';
import { useI18n } from '../context/I18nContext';
import { getPricesPageContent } from '../content/pages/prices';

const PricesPage = () => {
  const { siteLocale } = useI18n();
  const { packages, loading } = usePackages(siteLocale);
  const pricesPageContent = getPricesPageContent(siteLocale);
  const { seo, hero, pricing, form } = pricesPageContent;

  return (
    <div className="space-y-2">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <Section title={hero.title} subtitle={hero.subtitle}>
        <div className="grid gap-4 md:grid-cols-3">
          {loading || packages.length === 0 ? (
            <div className="col-span-3 text-center text-slate-400">{hero.loading}</div>
          ) : (
            packages.map((pack) => (
              <div key={pack.id} className="card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-semibold text-white">{pack.name}</div>
                  <div className="badge">{pack.forFormats?.[0] || hero.fallbackFormat}</div>
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
                    {hero.optionsLabel} {pack.options.join(', ')}
                  </div>
                )}
                <Link
                  to="/support"
                  className="mt-auto inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
                >
                  {hero.detailsLink}
                </Link>
              </div>
            ))
          )}
        </div>
      </Section>

      <Section className="pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card space-y-3">
            <div className="text-lg font-semibold text-white">{pricing.title}</div>
            <ul className="space-y-2 text-sm text-slate-200">
              {pricing.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <RequestForm title={form.title} subtitle={form.subtitle} ctaText={form.ctaText} />
        </div>
      </Section>
    </div>
  );
};

export default PricesPage;
