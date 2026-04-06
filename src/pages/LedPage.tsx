import { Helmet } from 'react-helmet-async';
import { RequestForm } from '../components/RequestForm';
import Section from '../components/Section';
import { useI18n } from '../context/I18nContext';
import { getLedPageContent } from '../content/pages/led';

const LedPage = () => {
  const { siteLocale } = useI18n();
  const ledPageContent = getLedPageContent(siteLocale);

  return (
    <div className="space-y-2">
    <Helmet>
      <title>{ledPageContent.seo.title}</title>
      <meta name="description" content={ledPageContent.seo.description} />
    </Helmet>

    <Section title={ledPageContent.hero.title} subtitle={ledPageContent.hero.subtitle}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card space-y-3">
          <div className="text-lg font-semibold text-white">{ledPageContent.benefitsTitle}</div>
          <ul className="space-y-2 text-sm text-slate-200">
            {ledPageContent.benefits.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card space-y-3">
          <div className="text-lg font-semibold text-white">{ledPageContent.configsTitle}</div>
          <ul className="space-y-2 text-sm text-slate-200">
            {ledPageContent.configs.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>

    <Section title={ledPageContent.selection.title} subtitle={ledPageContent.selection.subtitle}>
      <div className="grid gap-4 md:grid-cols-3">
        {ledPageContent.selection.cards.map((card) => (
          <div key={card.title} className="card">
            <div className="text-sm text-slate-400">{card.caption}</div>
            <div className="text-lg font-semibold text-white">{card.title}</div>
            <p className="text-sm text-slate-300">{card.description}</p>
          </div>
        ))}
      </div>
    </Section>

    <Section title={ledPageContent.faqTitle}>
      <div className="grid gap-3 md:grid-cols-2">
        {ledPageContent.faq.map((item) => (
          <div key={item} className="card text-sm text-slate-200">
            {item}
          </div>
        ))}
      </div>
    </Section>

    <Section className="pb-16">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <div className="text-lg font-semibold text-white">{ledPageContent.included.title}</div>
          <ul className="mt-2 space-y-2 text-sm text-slate-200">
            {ledPageContent.included.items.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <RequestForm
          title={ledPageContent.form.title}
          subtitle={ledPageContent.form.subtitle}
          ctaText={ledPageContent.form.ctaText}
        />
      </div>
    </Section>
    </div>
  );
};

export default LedPage;
