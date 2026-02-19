import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { useCategories } from '../hooks/useCategories';
import { rentCategoriesContent } from '../data/rentCategoriesContent';
import { RequestForm } from '../components/RequestForm';

const RentPage = () => {
  const { categories } = useCategories();

  return (
  <div className="space-y-2">
    <Helmet>
      <title>Аренда оборудования для мероприятий | Future Screen</title>
      <meta name="description" content="Аренда светового, звукового, видеооборудования, сцен и инструментов для мероприятий." />
    </Helmet>
    <Section title="Аренда оборудования" subtitle="Свет, звук, видео, сцены, инструменты">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const content = rentCategoriesContent.find((c) => c.id === cat.id);
          return (
            <Link key={cat.id} to={cat.pagePath} className="card block hover:border-brand-500/40">
              <div className="text-xl font-semibold text-white">{cat.title}</div>
              <p className="text-sm text-slate-300">{cat.shortDescription}</p>
              <ul className="mt-3 space-y-1 text-sm text-slate-200">
                {content?.facts.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400"></span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </Link>
          );
        })}
      </div>
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
