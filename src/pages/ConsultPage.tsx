import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { RequestForm } from '../components/RequestForm';
import { consultPageContent } from '../content/pages/consult';

const ConsultPage = () => {
  const { seo, hero, body, form } = consultPageContent;

  return (
    <div className="space-y-2">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <Section title={hero.title} subtitle={hero.subtitle}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card space-y-3 text-sm text-slate-200">
            <p>{body.description}</p>
            <ul className="space-y-2">
              {body.items.map((item) => (
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

export default ConsultPage;
