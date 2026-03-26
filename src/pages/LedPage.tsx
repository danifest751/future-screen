import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { RequestForm } from '../components/RequestForm';

const ledConfigs = [
  'Задник сцены с порталом и крыльями',
  'Подвесная конструкция для помещений',
  'Вогнутый/выпуклый экран с радиусом',
  'Стойка/тотем для стоек регистрации',
  'Порталы и подиумы для входных групп',
];

const benefits = [
  'Яркость и контраст при солнце и сценическом свете',
  'Модульность: любые размеры и формы',
  'Быстрая сборка/разборка, лёгкие корпуса',
  'Процессинг, инженеры и сервис в комплекте',
];

const faq = [
  'Как выбрать шаг пикселя? — От расстояния до зрителя: 2–3 мм для помещений, 3–4 мм для улицы.',
  'Что входит? — Доставка, монтаж, процессинг, инженер на площадке (по договорённости).',
  'Можно ли подвесить? — Да, при наличии точек крепления и расчёте нагрузок.',
  'Есть ли резерв? — Можем заложить резервные модули и процессинг по запросу.',
];

const LedPage = () => (
  <div className="space-y-2">
    <Helmet>
      <title>LED-экраны — аренда и монтаж | Фьючер Скрин</title>
      <meta name="description" content="Аренда LED-экранов для мероприятий: задники сцен, порталы, вогнутые конструкции. Монтаж, процессинг, инженеры." />
    </Helmet>
    <Section title="LED-экраны" subtitle="Задники сцен, порталы, вогнутые и подвесные конструкции">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card space-y-3">
          <div className="text-lg font-semibold text-white">Преимущества</div>
          <ul className="space-y-2 text-sm text-slate-200">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card space-y-3">
          <div className="text-lg font-semibold text-white">Типовые конфигурации</div>
          <ul className="space-y-2 text-sm text-slate-200">
            {ledConfigs.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>

    <Section title="Как выбрать" subtitle="Простая логика под задачу">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="text-sm text-slate-400">Шаг пикселя</div>
          <div className="text-lg font-semibold text-white">От расстояния до зрителя</div>
          <p className="text-sm text-slate-300">До 5 м — 2–2.6 мм, 5–10 м — 3–4 мм, улица/дальше — 4–6 мм.</p>
        </div>
        <div className="card">
          <div className="text-sm text-slate-400">Конструкция</div>
          <div className="text-lg font-semibold text-white">Зал, улица или подвес</div>
          <p className="text-sm text-slate-300">Подбираем рамы, подвес, стойки с учётом нагрузок и ветровых зон.</p>
        </div>
        <div className="card">
          <div className="text-sm text-slate-400">Содержание</div>
          <div className="text-lg font-semibold text-white">Плейаут и процессинг</div>
          <p className="text-sm text-slate-300">Медиасервер, коммутаторы, резервный источник по запросу.</p>
        </div>
      </div>
    </Section>

    <Section title="FAQ">
      <div className="grid gap-3 md:grid-cols-2">
        {faq.map((q) => (
          <div key={q} className="card text-sm text-slate-200">
            {q}
          </div>
        ))}
      </div>
    </Section>

    <Section className="pb-16">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <div className="text-lg font-semibold text-white">Что входит</div>
          <ul className="mt-2 space-y-2 text-sm text-slate-200">
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Доставка и монтаж</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Процессинг и плейаут</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Инженер на площадке</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>Резерв по запросу</li>
          </ul>
        </div>
        <RequestForm title="Подобрать LED-решение" subtitle="Опишите площадку и формат, подберём конфигурацию и КП." ctaText="Получить предложение" />
      </div>
    </Section>
  </div>
);

export default LedPage;
