import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { trackEvent } from '../lib/analytics';

// ─── Scroll reveal hook ───────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

// ─── Equipment data ───────────────────────────────────────────────────────────
const equipment = [
  {
    title: 'LED-экраны',
    desc: 'Интерьерные и уличные светодиодные экраны различного размера и разрешения от 2.6мм шаг пикселя',
    bullets: ['Экраны от 3×2м до 10×6м', 'Модульная система сборки', 'Фермовые конструкции до 7м'],
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect width="20" height="15" x="2" y="3" rx="2"/><path d="m8 21 4-4 4 4"/><path d="M9 17h6"/>
      </svg>
    ),
  },
  {
    title: 'Видеостены',
    desc: 'LCD панели для создания бесшовных видеостен конфигураций 2×2, 3×3, 4×4',
    bullets: ['Панели 55" 4K разрешение', 'Шов 3.5мм между панелями', 'До 40 панелей в наличии'],
    gradient: 'linear-gradient(135deg, #764ba2, #f093fb)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/>
      </svg>
    ),
  },
  {
    title: 'Плазменные панели',
    desc: 'LED и OLED панели диагональю от 32" до 100" для презентаций и выставок',
    bullets: ['Диагонали 32"—100"', '4K Ultra HD разрешение', 'Более 300 панелей в парке'],
    gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect width="20" height="15" x="2" y="3" rx="2"/><path d="m8 21 4-4 4 4"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    title: 'Звуковое оборудование',
    desc: 'Профессиональные звуковые комплекты, микрофоны, микшеры для концертов и конференций',
    bullets: ['Активные акустические системы', 'Радиомикрофоны Shure/Sennheiser', 'Микшерные пульты'],
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      </svg>
    ),
  },
  {
    title: 'Световое оборудование',
    desc: 'Прожекторы, PAR-ы, LED-панели, динамические головы для сценического освещения',
    bullets: ['LED PAR и прожекторы', 'Динамические световые приборы', 'Контроллеры DMX'],
    gradient: 'linear-gradient(135deg, #ffd89b, #19547b)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>
      </svg>
    ),
  },
  {
    title: 'Сценические конструкции',
    desc: 'Модульные сцены, фермы, подиумы и трасты для создания площадок любой сложности',
    bullets: ['Модульные сценические площадки', 'Алюминиевые фермы', 'Подвес для света и экранов'],
    gradient: 'linear-gradient(135deg, #11998e, #38ef7d)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
];

const extraEquipment = [
  {
    title: 'Компьютеры и ноутбуки',
    desc: 'Core i7/i5, игровые и офисные конфигурации',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>
      </svg>
    ),
  },
  {
    title: 'Тачскрины',
    desc: 'Интерактивные столы 42"–55" с 10-точечным касанием',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5a2 2 0 0 0-2-2a2 2 0 0 0-2 2V19a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-5a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/>
      </svg>
    ),
  },
  {
    title: 'Технический персонал',
    desc: 'Видеооператоры, звукорежиссёры, техники',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

// ─���─ Event types data ─────────────────────────────────────────────────────────
const eventTypes = [
  {
    title: 'Корпоративы',
    desc: 'Техническое оснащение корпоративных праздников и тимбилдингов',
    gradient: 'linear-gradient(135deg, rgba(102,126,234,0.8), rgba(118,75,162,0.8))',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    title: 'Концерты',
    desc: 'Полный технический райдер для концертных площадок и фестивалей',
    gradient: 'linear-gradient(135deg, rgba(118,75,162,0.8), rgba(240,147,251,0.8))',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12"/><circle cx="17" cy="7" r="5"/>
      </svg>
    ),
  },
  {
    title: 'Конференции',
    desc: 'Системы синхронного перевода, проекторы, микрофоны',
    gradient: 'linear-gradient(135deg, rgba(79,172,254,0.8), rgba(0,242,254,0.8))',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
      </svg>
    ),
  },
  {
    title: 'Свадьбы',
    desc: 'LED-экраны для банкетных залов, свет, звук',
    gradient: 'linear-gradient(135deg, rgba(245,87,108,0.8), rgba(240,147,251,0.8))',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    ),
  },
  {
    title: 'Выставки',
    desc: 'Видеостены для стендов, интерактивные панели',
    gradient: 'linear-gradient(135deg, rgba(17,153,142,0.8), rgba(56,239,125,0.8))',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h4"/><path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
      </svg>
    ),
  },
  {
    title: 'Презентации',
    desc: 'Премиум-решения для продуктовых презентаций',
    gradient: 'linear-gradient(135deg, rgba(255,216,155,0.8), rgba(245,87,108,0.8))',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>
      </svg>
    ),
  },
];

// ─── Process steps ────────────────────────────────────────────────────────────
const processSteps = [
  { num: '01', title: 'Заявка', desc: 'Опишите ваше мероприятие — дату, количество гостей, площадку и задачи' },
  { num: '02', title: 'Расчёт', desc: 'Подбираем оптимальное оборудование и составляем коммерческое предложение' },
  { num: '03', title: 'Монтаж', desc: 'Доставка, установка и настройка всего оборудования заранее до мероприятия' },
  { num: '04', title: 'Поддержка', desc: 'Техническое сопровождение во время события и демонтаж после' },
];

// ─── Section wrapper with scroll reveal ──────────────────────────────────────
const RevealSection = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const ref = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      className={className}
      style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}
    >
      {children}
    </div>
  );
};

// ─── HomePage ─────────────────────────────────────────────────────────────────
const HomePage = () => {
  return (
    <div>
      <Helmet>
        <title>Future Screen — Техническое оснащение мероприятий | LED-экраны, звук, свет</title>
        <meta name="description" content="Аренда LED-экранов, звукового и светового оборудования в Екатеринбурге. Техническое сопровождение концертов, корпоративов, конференций с 2007 года." />
        <meta name="keywords" content="аренда led экранов, техническое оснащение мероприятий, аренда звука, аренда света, сценические конструкции, видеостены, Екатеринбург" />
      </Helmet>

      {/* ── 1. HERO ────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center overflow-hidden -mt-16 lg:-mt-20">
        {/* Animated gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="animate-blob-pulse absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(102,126,234,0.4) 0%, transparent 70%)', filter: 'blur(80px)' }}
          />
          <div
            className="animate-float-delayed absolute -right-32 top-20 h-[500px] w-[500px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(118,75,162,0.5) 0%, transparent 70%)', filter: 'blur(80px)' }}
          />
          <div
            className="animate-float absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(240,147,251,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          {/* Top gradient overlay */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[rgba(102,126,234,0.05)] to-transparent" />
        </div>

        <div className="container-page relative z-10 py-32 md:py-40">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 backdrop-blur-sm">
              <span className="animate-dot-pulse h-2 w-2 rounded-full bg-green-400" />
              Работаем по всей России с 2007 года
            </div>

            {/* H1 */}
            <h1 className="font-display mb-6 text-balance text-5xl font-bold leading-tight text-white md:text-7xl lg:text-8xl">
              Техническое{' '}
              <span className="gradient-text">оснащение</span>
              <br />
              мероприятий
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg leading-relaxed text-gray-400 md:text-xl">
              LED-экраны, свет, звук, сцены и комплекты «под ключ» для выставок, концертов, конференций и корпоративов
            </p>

            {/* CTA */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#contacts"
                onClick={(e) => { e.preventDefault(); document.getElementById('contacts')?.scrollIntoView({ behavior: 'smooth' }); trackEvent('click_cta_hero'); }}
                className="btn-primary text-base"
              >
                Рассчитать мероприятие
              </a>
              <Link to="/cases" className="btn-secondary text-base">
                Смотреть кейсы
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { value: '18+', label: 'лет опыта' },
                { value: '500+', label: 'мероприятий/год' },
                { value: '300+', label: 'единиц техники' },
                { value: '24/7', label: 'поддержка' },
              ].map((stat) => (
                <div key={stat.label} className="glass rounded-2xl p-4 text-center">
                  <div className="font-display gradient-text text-3xl font-bold md:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. ABOUT ──────────────────────────────────────────────────────── */}
      <section id="about" className="py-24 md:py-32">
        <div className="container-page">
          <RevealSection>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Text */}
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
                  О компании
                </div>
                <h2 className="font-display mb-6 text-balance text-4xl font-bold text-white md:text-5xl">
                  Создаём{' '}
                  <span className="gradient-text">визуальный</span>{' '}
                  опыт
                </h2>
                <p className="mb-4 text-lg leading-relaxed text-gray-400">
                  Future Screen — это команда профессионалов, превращающих технические задачи в безупречный визуальный результат. Мы не просто сдаём оборудование в аренду — мы проектируем технологические решения для вашего события.
                </p>
                <p className="mb-8 text-lg leading-relaxed text-gray-400">
                  От небольших презентаций до масштабных концертных туров — обеспечиваем полный цикл: от консультации и подбора оборудования до монтажа, управления на площадке и демонтажа.
                </p>
                <ul className="space-y-3">
                  {['Собственный парк техники', 'Выезд в любой регион РФ', 'Сертифицированные специалисты'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-300">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: 'var(--accent-gradient)' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                          <path d="m20 6-11 11-5-5"/>
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Feature cards grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'LED & видео', color: '#667eea', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><rect width="20" height="15" x="2" y="3" rx="2"/><path d="m8 21 4-4 4 4"/></svg> },
                  { label: 'Звук', color: '#f093fb', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> },
                  { label: 'Спецэффекты', color: '#667eea', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg> },
                  { label: 'Съёмка', color: '#764ba2', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg> },
                ].map((item) => (
                  <div key={item.label} className="card flex flex-col items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: item.color, background: `${item.color}20` }}>
                      {item.icon}
                    </div>
                    <span className="font-medium text-white">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── 3. EQUIPMENT ──────────────────────────────────────────���───────── */}
      <section id="equipment" className="py-24 md:py-32">
        <div className="container-page">
          <RevealSection>
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
                Парк оборудования
              </div>
              <h2 className="font-display mb-4 text-balance text-4xl font-bold text-white md:text-5xl">
                Оборудование{' '}
                <span className="gradient-text">в аренду</span>
              </h2>
              <p className="mx-auto max-w-2xl text-gray-400">
                Полный спектр профессионального оборудования для мероприятий любого масштаба
              </p>
            </div>
          </RevealSection>

          {/* Main 6 cards */}
          <RevealSection className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {equipment.map((item) => (
              <div
                key={item.title}
                className="card group cursor-pointer"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white"
                  style={{ background: item.gradient }}
                >
                  {item.icon}
                </div>
                <h3 className="font-display mb-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-400">{item.desc}</p>
                <ul className="space-y-2">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--accent-gradient)' }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </RevealSection>

          {/* Extra 3 */}
          <RevealSection className="mt-5 grid gap-5 sm:grid-cols-3">
            {extraEquipment.map((item) => (
              <div key={item.title} className="card flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-gray-400">
                  {item.icon}
                </div>
                <div>
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="mt-1 text-sm text-gray-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </RevealSection>
        </div>
      </section>

      {/* ── 4. EVENT TYPES ────────────────────────────────────────────────── */}
      <section id="services" className="py-24 md:py-32">
        <div className="container-page">
          <RevealSection>
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
                Наши направления
              </div>
              <h2 className="font-display mb-4 text-balance text-4xl font-bold text-white md:text-5xl">
                Направления{' '}
                <span className="gradient-text">мероприятий</span>
              </h2>
            </div>
          </RevealSection>

          <RevealSection className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventTypes.map((item) => (
              <div
                key={item.title}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10"
                style={{ aspectRatio: '4/3' }}
              >
                {/* Gradient bg */}
                <div
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{ background: item.gradient }}
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-black/20" />
                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                  <div className="mb-3 opacity-90">{item.icon}</div>
                  <h3 className="font-display text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed opacity-0 transition-opacity duration-300 group-hover:opacity-90">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </RevealSection>
        </div>
      </section>

      {/* ── 5. PROCESS ────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="container-page">
          <RevealSection>
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
                Процесс работы
              </div>
              <h2 className="font-display mb-4 text-balance text-4xl font-bold text-white md:text-5xl">
                Как мы{' '}
                <span className="gradient-text">работаем</span>
              </h2>
            </div>
          </RevealSection>

          <RevealSection className="relative grid gap-6 md:grid-cols-4">
            {/* Connector line */}
            <div
              className="absolute left-0 right-0 top-10 hidden h-px md:block"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(102,126,234,0.4), transparent)' }}
            />
            {processSteps.map((step, idx) => (
              <div key={step.num} className="card relative text-center">
                <div
                  className="font-display mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
                  style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--glow)' }}
                >
                  {step.num}
                </div>
                <h3 className="font-display mb-2 text-lg font-semibold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{step.desc}</p>
              </div>
            ))}
          </RevealSection>
        </div>
      </section>

      {/* ── 6. CTA ────────────────────────────────────────────────────────── */}
      <section id="contacts" className="py-24 md:py-32">
        <div className="container-page">
          <RevealSection>
            <div className="relative overflow-hidden rounded-3xl p-10 text-center md:p-16">
              {/* BG gradient */}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.25) 0%, rgba(118,75,162,0.25) 100%)' }}
              />
              <div className="absolute inset-0" style={{ backdropFilter: 'blur(0px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'inherit' }} />
              {/* Center glow */}
              <div
                className="animate-pulse-slow absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30"
                style={{ background: 'radial-gradient(circle, rgba(102,126,234,0.6) 0%, transparent 70%)', filter: 'blur(60px)' }}
              />
              {/* Grid */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                  borderRadius: 'inherit',
                }}
              />

              <div className="relative z-10">
                <h2 className="font-display mb-4 text-balance text-4xl font-bold text-white md:text-5xl">
                  Готовы обсудить{' '}
                  <span className="gradient-text">ваше мероприятие?</span>
                </h2>
                <p className="mx-auto mb-8 max-w-xl text-gray-400">
                  Расскажите о вашем проекте — мы рассчитаем стоимость и предложим лучшее техническое решение
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <a
                    href="tel:+79122466566"
                    onClick={() => trackEvent('click_phone')}
                    className="btn-primary text-base"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/>
                    </svg>
                    Позвонить
                  </a>
                  <a
                    href="https://wa.me/79122466566"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('click_whatsapp')}
                    className="btn-secondary text-base"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    Написать в WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
