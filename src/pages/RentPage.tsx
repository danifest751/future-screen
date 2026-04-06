import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { useRentalCategories } from '../services/rentalCategories';
import { RequestForm } from '../components/RequestForm';
import { useI18n } from '../context/I18nContext';
import { getRentPageContent } from '../content/pages/rent';
import { getRentalCategoryDisplay } from '../content/data/rentalCategoryLabels';

const RentPage = () => {
  const { siteLocale } = useI18n();
  const { items, loading, error } = useRentalCategories();
  const rentPageContent = getRentPageContent(siteLocale);
  const { seo, hero, checklist, form } = rentPageContent;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="space-y-2">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <Section title={hero.title} subtitle={hero.subtitle}>
        {loading && (
          <div className="col-span-3 text-center text-slate-400">{hero.loading}</div>
        )}
        {error && (
          <div className="col-span-3 text-center text-red-400">{hero.error}</div>
        )}
        {!loading && !error && items.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((cat) => (
              <Link key={cat.id} to={`/rent/${cat.slug}`} className="card block hover:border-brand-500/40">
                {(() => {
                  const display = getRentalCategoryDisplay(cat.slug, cat.name, cat.shortName, siteLocale);
                  return (
                    <>
                      <div className="text-xl font-semibold text-white">{display.name}</div>
                      <p className="text-sm text-slate-300">{display.shortName}</p>
                    </>
                  );
                })()}
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section className="pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <div className="text-lg font-semibold text-white">{checklist.title}</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
              {checklist.items.map((item) => (
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

export default RentPage;
