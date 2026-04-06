import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { notFoundPageContent } from '../content/pages/notFound';

const NotFoundPage = () => (
  <div className="space-y-2">
    <Helmet>
      <title>{notFoundPageContent.seoTitle}</title>
    </Helmet>
    <Section title={notFoundPageContent.title} subtitle={notFoundPageContent.subtitle}>
      <div className="card space-y-3 text-sm text-slate-200">
        <p>{notFoundPageContent.description}</p>
        <div className="flex gap-3">
          <Link to="/" className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-400">
            {notFoundPageContent.homeLink}
          </Link>
          <Link to="/contacts" className="rounded-lg border border-white/20 px-4 py-2 font-semibold text-white hover:border-white/40">
            {notFoundPageContent.contactsLink}
          </Link>
        </div>
      </div>
    </Section>
  </div>
);

export default NotFoundPage;
