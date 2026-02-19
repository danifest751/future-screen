import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { usePackages } from '../hooks/usePackages';
import { useCategories } from '../hooks/useCategories';
import { useCases } from '../hooks/useCases';
import { RequestForm } from '../components/RequestForm';
import { trackEvent } from '../lib/analytics';

const tasks = ['Для выставок', 'Для концертов', 'Для конференций', 'Для банкетов', 'Для презентаций'];

const processSteps = [
  'Запрос и бриф — что, где, когда, формат',
  'Предлагаем решение и КП за 15 минут',
  'Уточняем площадку, схемы, точки питания',
  'Готовим комплект и резерв, выезд монтажной бригады',
  'Сборка, тесты, сопровождение мероприятия',
  'Демонтаж, обратная логистика, отчёт',
];

const trust = ['Работаем с 2007 года', 'По всей РФ', 'Инженеры и монтажные бригады в штате'];

const HomePage = () => {
  const { packages } = usePackages();
  const { categories } = useCategories();
  const { cases } = useCases();

  return (
  <div className="space-y-2">
    <Helmet>
      <title>Future Screen — LED, звук, свет, сцены</title>
      <meta name="description" content="Техсопровождение мероприятий: LED-экраны, звук, свет, сцены. КП за 15 минут. Работаем по РФ с 2007 года." />
    </Helmet>
    <Section className="pt-4 md:pt-8">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-sm text-brand-100">
            Future Screen · Техсопровождение с 2007 года
          </div>
          <h1 className="text-4xl font-semibold text-white md:text-5xl">
            LED, свет, звук, сцены и пакеты «под ключ» с КП за 15 минут
          </h1>
          <p className="text-lg text-slate-300">
            Быстро собираем решения под выставки, концерты, форумы и презентации. Монтаж, процессинг, инженеры и резерв — в одном месте.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/support"
              className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-400"
            >
              Пакеты «под ключ»
            </Link>
            <a
              href="tel:+79122466566"
              onClick={() => trackEvent('click_phone')}
              className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:border-white/40"
            >
              Позвонить: +7 (912) 246-65-66
            </a>
            <a
              href="https://wa.me/79530458558"
              onClick={() => trackEvent('click_whatsapp')}
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-100 hover:border-emerald-500/60"
            >
              WhatsApp
            </a>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            {trust.map((item) => (
              <span key={item} className="badge">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="card">
          <RequestForm title="КП за 15 минут" subtitle="Опишите задачу — подберём комплект и отправим расчёт." ctaText="Получить КП" />
        </div>
      </div>
    </Section>

    <Section title="Для каких задач" subtitle="Быстрый выбор по формату мероприятия">
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        {tasks.map((task) => (
          <div key={task} className="card text-center">
            <div className="text-lg font-semibold text-white">{task}</div>
            <p className="text-sm text-slate-300">Подберём комплект под площадку, сценарий и бюджет.</p>
          </div>
        ))}
      </div>
    </Section>

    <Section title="Пакеты техсопровождения" subtitle="Лайт · Медиум · Биг" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {packages.map((pack) => (
          <div key={pack.id} className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold text-white">{pack.name}</div>
              <div className="badge">{pack.forFormats[0]}</div>
            </div>
            <div className="text-sm text-slate-300">{pack.priceHint}</div>
            <ul className="space-y-2 text-sm text-slate-200">
              {pack.includes.map((item) => (
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
        ))}
      </div>
    </Section>

    <Section title="Категории аренды" subtitle="LED, свет, звук, видео, сцены, инструменты">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        {categories.map((cat) => (
          <Link key={cat.id} to={cat.pagePath} className="card block hover:border-brand-500/40">
            <div className="text-xl font-semibold text-white">{cat.title}</div>
            <p className="text-sm text-slate-300">{cat.shortDescription}</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-200">
              {cat.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400"></span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </Section>

    <Section title="Кейсы" subtitle="Сильные проекты с цифрами и фото">
      <div className="grid gap-4 md:grid-cols-3">
        {cases.slice(0, 3).map((item) => (
          <Link key={item.slug} to={`/cases/${item.slug}`} className="card block hover:border-brand-500/40">
            <div className="text-sm text-slate-400">{item.city} · {item.date} · {item.format}</div>
            <div className="mt-1 text-lg font-semibold text-white">{item.title}</div>
            <p className="text-sm text-slate-300">{item.summary}</p>
            {item.metrics && <div className="mt-2 text-xs text-brand-100">{item.metrics}</div>}
          </Link>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link to="/cases" className="inline-flex items-center rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-white/40">
          Смотреть все кейсы
        </Link>
      </div>
    </Section>

    <Section title="Как мы работаем" subtitle="Прозрачный процесс и сроки">
      <div className="grid gap-3 md:grid-cols-3">
        {processSteps.map((step, idx) => (
          <div key={step} className="card">
            <div className="text-sm text-slate-400">Шаг {idx + 1}</div>
            <div className="mt-1 text-lg font-semibold text-white">{step}</div>
          </div>
        ))}
      </div>
    </Section>

    <Section className="pb-16">
      <div className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold text-white">Готовы обсудить задачу?</div>
          <div className="text-sm text-slate-300">Позвоните или оставьте заявку — ответим в течение 15 минут.</div>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="tel:+79122466566"
            onClick={() => trackEvent('click_phone')}
            className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-400"
          >
            Позвонить
          </a>
          <a
            href="https://wa.me/79530458558"
            onClick={() => trackEvent('click_whatsapp')}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-100 hover:border-emerald-500/60"
          >
            WhatsApp
          </a>
          <Link
            to="/contacts"
            className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:border-white/40"
          >
            Контакты
          </Link>
        </div>
      </div>
    </Section>
  </div>
  );
};

export default HomePage;
