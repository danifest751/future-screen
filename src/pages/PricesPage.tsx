import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { usePackages } from '../hooks/usePackages';
import { RequestForm } from '../components/RequestForm';

const PricesPage = () => {
  const { packages, loading } = usePackages();

  return (
    <div className="space-y-2">
      <Helmet>
        <title>Пакеты и цены | Фьючер Скрин</title>
        <meta name="description" content="Пакеты техсопровождения: Лайт, Медиум, Биг. Прозрачные цены на LED, звук, свет, сцены." />
      </Helmet>
      <Section title="Пакеты и ориентиры" subtitle="Лайт · Медиум · Биг — подберите базовый комплект">
        <div className="grid gap-4 md:grid-cols-3">
          {loading || packages.length === 0 ? (
            <div className="col-span-3 text-center text-slate-400">Загрузка...</div>
          ) : (
            packages.map((pack) => (
              <div key={pack.id} className="card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-semibold text-white">{pack.name}</div>
                  <div className="badge">{pack.forFormats?.[0] || 'Универсальный'}</div>
                </div>
                <div className="text-sm text-slate-300">{pack.priceHint}</div>
                <ul className="space-y-2 text-sm text-slate-200">
                  {pack.includes?.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {pack.options && <div className="text-xs text-slate-400">Опции: {pack.options.join(', ')}</div>}
                <Link
                  to="/support"
                  className="mt-auto inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
                >
                  Подробнее
                </Link>
              </div>
            ))
          )}
        </div>
      </Section>

      <Section className="pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card space-y-3">
            <div className="text-lg font-semibold text-white">Как формируем цену</div>
            <ul className="space-y-2 text-sm text-slate-200">
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Формат и длительность мероприятия</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Площадка: зал/улица, габариты, подвес</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Состав оборудования и резерв</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Логистика и окна на монтаж/демонтаж</li>
            </ul>
          </div>
          <RequestForm title="Получить ориентир" subtitle="Опишите формат — вышлем примерные вилки" ctaText="Запросить вилку" />
        </div>
      </Section>
    </div>
  );
};

export default PricesPage;
