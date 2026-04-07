import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { RequestForm } from '../components/RequestForm';
import Section from '../components/Section';
import { useI18n } from '../context/I18nContext';
import { getSupportPageContent } from '../content/pages/support';
import { usePackages } from '../hooks/usePackages';

const SupportPage = () => {
  const { siteLocale } = useI18n();
  const { packages, loading } = usePackages(siteLocale);
  const supportPageContent = getSupportPageContent(siteLocale);

  return (
    <div className="space-y-2">
      <Helmet>
        <title>{supportPageContent.seo.title}</title>
        <meta name="description" content={supportPageContent.seo.description} />
      </Helmet>

      <Section title={supportPageContent.hero.title} subtitle={supportPageContent.hero.subtitle}>
        <div className="grid gap-4 md:grid-cols-3">
          {loading || packages.length === 0 ? (
            <div className="col-span-3 text-center text-slate-400">{supportPageContent.loading}</div>
          ) : (
            packages.map((pack) => (
              <div key={pack.id} className="card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-semibold text-white">{pack.name}</div>
                  <div className="badge">
                    {pack.forFormats?.[0] || supportPageContent.universalBadge}
                  </div>
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
                    {supportPageContent.optionsPrefix} {pack.options.join(', ')}
                  </div>
                ) : null}
                <div className="text-xs text-slate-400">
                  {supportPageContent.formatsPrefix} {pack.forFormats?.join(' · ') || '—'}
                </div>
                <Link
                  to="/consult"
                  className="mt-auto inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
                >
                  {supportPageContent.discussPackage}
                </Link>
              </div>
            ))
          )}
        </div>
      </Section>

      <Section
        title={supportPageContent.process.title}
        subtitle={supportPageContent.process.subtitle}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {supportPageContent.process.items.map((item, index) => (
            <div key={item} className="card">
              <div className="text-sm text-slate-400">
                {supportPageContent.process.stepPrefix} {index + 1}
              </div>
              <div className="mt-1 text-lg font-semibold text-white">{item}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card space-y-3">
            <div className="text-lg font-semibold text-white">
              {supportPageContent.advantages.title}
            </div>
            <ul className="space-y-2 text-sm text-slate-200">
              {supportPageContent.advantages.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <RequestForm
            title={supportPageContent.form.title}
            subtitle={supportPageContent.form.subtitle}
            ctaText={supportPageContent.form.ctaText}
          />
        </div>
      </Section>
    </div>
  );
};

export default SupportPage;
