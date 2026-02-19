import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { useCases } from '../hooks/useCases';

const CasesPage = () => {
  const { cases } = useCases();

  return (
  <div className="space-y-2">
    <Helmet>
      <title>Кейсы — реализованные проекты | Future Screen</title>
      <meta name="description" content="Портфолио реализованных проектов: форумы, концерты, выставки. Цифры, состав работ и фото." />
    </Helmet>
    <Section title="Кейсы" subtitle="Реализованные проекты с цифрами и составом работ">
      <div className="grid gap-4 md:grid-cols-3">
        {cases.map((item) => (
          <Link key={item.slug} to={`/cases/${item.slug}`} className="card block hover:border-brand-500/40">
            <div className="text-sm text-slate-400">
              {item.city} · {item.date} · {item.format}
            </div>
            <div className="mt-1 text-lg font-semibold text-white">{item.title}</div>
            <p className="text-sm text-slate-300">{item.summary}</p>
            {item.metrics && <div className="mt-2 text-xs text-brand-100">{item.metrics}</div>}
            <div className="mt-2 text-xs text-slate-400">Услуги: {item.services.join(', ')}</div>
          </Link>
        ))}
      </div>
    </Section>
  </div>
  );
};

export default CasesPage;
