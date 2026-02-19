import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';

const AboutPage = () => (
  <div className="space-y-2">
    <Helmet>
      <title>О компании | Future Screen</title>
      <meta name="description" content="Future Screen — техсопровождение мероприятий с 2007 года. Инженеры, монтажные бригады, работа по всей РФ." />
    </Helmet>
    <Section title="О компании" subtitle="С 2007 года, технический партнёр для событий по всей РФ">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card space-y-3 text-sm text-slate-200">
          <p>
            Мы работаем с 2007 года и сопровождаем форумы, концерты, выставки и презентации. В штате — инженеры, монтажные
            бригады и продюсеры, которые отвечают за результат на площадке.
          </p>
          <p>
            География: Екатеринбург и регион, Москва/СПб, а также выезды по РФ. Согласовываем площадку, точки крепления,
            схемы питания и логистику.
          </p>
          <p>
            Мы дорожим репутацией: закладываем резерв по запросу, прозрачно считаем сметы и держим сроки монтажа/демонтажа.
          </p>
        </div>
        <div className="card space-y-2 text-sm text-slate-200">
          <div className="text-lg font-semibold text-white">Факты</div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>2007+ лет опыта</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Проекты по РФ: форумы, городские события, выставки</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Инженеры и монтажные бригады в штате</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Резерв оборудования и процессинга по запросу</li>
          </ul>
        </div>
      </div>
    </Section>
  </div>
);

export default AboutPage;
