import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { RequestForm } from '../components/RequestForm';

const ConsultPage = () => (
  <div className="space-y-2">
    <Helmet>
      <title>Консультация по оборудованию | Фьючер Скрин</title>
      <meta name="description" content="Бесплатная консультация: подбор LED, звука, света, сцен под вашу площадку и формат мероприятия." />
    </Helmet>
    <Section title="Консультация" subtitle="Подбор оборудования и схемы площадки">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card space-y-3 text-sm text-slate-200">
          <p>
            Поможем выбрать LED, звук, свет, сцену или пакеты «под ключ». Рассчитаем покрытие, шаг пикселя, мощность звука,
            точки подвеса и резерв. Ответим за 15 минут.
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Разбор брифа: формат, площадка, сроки</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Рекомендации по конфигурации и резерву</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Карта точек питания, подвесов и кабель-менеджмента</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>КП и срок монтажа/демонтажа</li>
          </ul>
        </div>
        <RequestForm title="Получить консультацию" subtitle="Опишите задачу — ответим в течение 15 минут" ctaText="Отправить" />
      </div>
    </Section>
  </div>
);

export default ConsultPage;
