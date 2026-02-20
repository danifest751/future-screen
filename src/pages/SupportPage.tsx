import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { usePackages } from '../hooks/usePackages';
import { RequestForm } from '../components/RequestForm';

const SupportPage = () => {
  const { packages, loading } = usePackages();

  return (
  <div className="space-y-2">
    <Helmet>
      <title>Техсопровождение мероприятий | Future Screen</title>
      <meta name="description" content="Пакеты техсопровождения мероприятий: LED, звук, свет, сцены. Лайт, Медиум, Биг — под любой формат." />
    </Helmet>
    <Section title="Техсопровождение под ключ" subtitle="Лайт · Медиум · Биг — под формат мероприятия">
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
              <div className="text-xs text-slate-400">Для: {pack.forFormats?.join(' · ') || '—'}</div>
              <Link
                to="/consult"
                className="mt-auto inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
              >
                Обсудить пакет
              </Link>
            </div>
          ))
        )}
      </div>
    </Section>

    <Section title="Процесс" subtitle="Прозрачно и с резервом">
      <div className="grid gap-3 md:grid-cols-3">
        {[
          'Бриф: что, где, когда, формат мероприятия',
          'Расчёт и КП за 15 минут, схемы площадки',
          'Подбор оборудования, резерв по запросу',
          'Логистика, монтаж, программирование',
          'Сопровождение инженерами, оперативные правки',
          'Демонтаж и отчёт',
        ].map((item, idx) => (
          <div key={item} className="card">
            <div className="text-sm text-slate-400">Шаг {idx + 1}</div>
            <div className="mt-1 text-lg font-semibold text-white">{item}</div>
          </div>
        ))}
      </div>
    </Section>

    <Section className="pb-16">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card space-y-3">
          <div className="text-lg font-semibold text-white">Почему мы</div>
          <ul className="space-y-2 text-sm text-slate-200">
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>С 2007 года, проекты по всей РФ</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Инженеры и монтажные бригады в штате</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Резерв оборудования и процессинга по запросу</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Отвечаем за результат и сроки</li>
          </ul>
        </div>
        <RequestForm title="Получить предложение" subtitle="Опишите формат — подберём пакет и состав" ctaText="Запросить КП" />
      </div>
    </Section>
  </div>
  );
};

export default SupportPage;
