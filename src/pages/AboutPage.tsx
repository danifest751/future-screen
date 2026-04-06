import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { aboutPageContent } from '../content/pages/about';

const AboutPage = () => {
  const { seo, section, paragraphs, factsTitle, facts } = aboutPageContent;

  return (
    <div className="space-y-2">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <Section title={section.title} subtitle={section.subtitle}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card space-y-3 text-sm text-slate-200">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="card space-y-2 text-sm text-slate-200">
          <div className="text-lg font-semibold text-white">{factsTitle}</div>
          <ul className="space-y-2">
            {facts.map((fact) => (
              <li key={fact} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </div>
      </Section>
    </div>
  );
};

export default AboutPage;
