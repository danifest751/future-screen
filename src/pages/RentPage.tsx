import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { useRentalCategories } from '../services/rentalCategories';
import { RequestForm } from '../components/RequestForm';

const RentPage = () => {
  const { items, loading, error } = useRentalCategories();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="space-y-2">
      <Helmet>
        <title>Аренда оборудования для мероприятий | Фьючер Скрин</title>
        <meta name="description" content="Аренда светового, звукового, видеооборудования, сцен и инструментов для мероприятий." />
      </Helmet>
      <Section title="Аренда оборудования" subtitle="Свет, звук, видео, сцены, инструменты">
        {loading && (
          <div className="col-span-3 text-center text-slate-400">Загрузка...</div>
        )}
        {error && (
          <div className="col-span-3 text-center text-red-400">Ошибка загрузки категорий</div>
        )}
        {!loading && !error && items.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((cat) => (
              <Link key={cat.id} to={`/rent/${cat.slug}`} className="card block hover:border-brand-500/40">
                <div className="text-xl font-semibold text-white">{cat.name}</div>
                <p className="text-sm text-slate-300">{cat.shortName}</p>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section className="pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <div className="text-lg font-semibold text-white">Что важно учесть</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Формат и площадка: зал/улица, высота потолка, точки подвеса</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Сценарий: выступления, презентации, трансляция, количество микрофонов</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Сроки и логистика: окна на монтаж/демонтаж, доступы</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Резерв: источник питания, процессинг, запасные каналы</li>
            </ul>
          </div>
          <RequestForm title="Запросить аренду" subtitle="Опишите формат и площадку — подберём комплект" ctaText="Получить подбор" />
        </div>
      </Section>
    </div>
  );
};

export default RentPage;
