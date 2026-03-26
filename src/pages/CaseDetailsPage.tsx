import { Link, Navigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { useCases } from '../hooks/useCases';
import { RequestForm } from '../components/RequestForm';
import { trackEvent } from '../lib/analytics';
import type { CaseItem } from '../data/cases';

const CaseDetailsPage = () => {
  const { slug } = useParams();
  const { cases } = useCases();
  const item = cases.find((c) => c.slug === slug);

  useEffect(() => {
    if (item) {
      trackEvent('view_case', { slug: item.slug });
    }
  }, [item]);

  if (!item) return <Navigate to="/cases" replace />;

  return (
    <div className="space-y-2">
      <Helmet>
        <title>{item.title} — кейс | Фьючер Скрин</title>
        <meta name="description" content={item.summary} />
      </Helmet>
      <Section title={item.title} subtitle={`${item.city} · ${item.date} · ${item.format}`}>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card md:col-span-2">
            <div className="text-sm text-slate-400">Услуги: {item.services.join(', ')}</div>
            <p className="mt-2 text-slate-200">{item.summary}</p>
            {item.metrics && <div className="mt-3 text-sm text-brand-100">{item.metrics}</div>}
            {item.images && item.images.length > 0 && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {item.images.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt={item.title}
                    className="h-40 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            {(item as CaseItem & { videos?: string[] }).videos && (item as CaseItem & { videos?: string[] }).videos!.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="text-sm text-slate-400">Видео</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {(item as CaseItem & { videos?: string[] }).videos!.map((src) => (
                    <video
                      key={src}
                      src={src}
                      controls
                      className="h-48 w-full rounded-xl object-cover"
                      preload="metadata"
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 text-sm text-slate-400">
              Нужны детали? <Link to="/contacts" className="text-brand-200 hover:text-brand-100">Свяжитесь с нами</Link>
            </div>
          </div>
          <RequestForm title="Запросить похожий проект" subtitle="Опишите формат и сроки — предложим конфигурацию" ctaText="Обсудить" />
        </div>
      </Section>
    </div>
  );
};

export default CaseDetailsPage;
