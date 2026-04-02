import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { trackEvent } from '../lib/analytics';
import { submitForm } from '../lib/submitForm';
import { ConsentCheckbox } from '../components/ConsentCheckbox';

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
    link: '/rent/video',
    photo: '/images/led-closeup.png',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect width="20" height="15" x="2" y="3" rx="2"/><path d="m8 21 4-4 4 4"/><path d="M9 17h6"/>
      </svg>
    ),
  },
  {
    title: 'Плазменные панели',
    desc: 'LED и OLED панели диагональю от 32" до 100" для презентаций и выставок',
    bullets: ['Диагонали 32"—100"', '4K Ultra HD разрешение', 'Более 300 панелей в парке'],
    gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    link: '/rent/video',
    photo: '/images/equip-plasma.png',
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
    link: '/rent/sound',
    photo: '/images/equip-sound.png',
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
    link: '/rent/light',
    photo: '/images/equip-light.png',
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
    link: '/rent/stage',
    photo: '/images/equip-stage.png',
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
    link: '/rent/computers',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>
      </svg>
    ),
  },
  {
    title: 'Тачскрины',
    desc: 'Интерактивные столы 42"–55" с 10-точечным касанием',
    link: '/rent/touchscreens',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5a2 2 0 0 0-2-2a2 2 0 0 0-2 2V19a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-5a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/>
      </svg>
    ),
  },
  {
    title: 'Технический персонал',
    desc: 'Видеооператоры, звукорежиссёры, техники',
    link: '/rent/staff',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

// ─── Event types data ─────────────────────────────────────────────────────────
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
    desc: 'Светодиодные экраны для стендов, интерактивные панели',
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

// ─── CTA Form Component ───────────────────────────────────────────────────────
const CtaForm = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [consent, setConsent] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Введите имя (минимум 2 символа)';
    }
    const phoneRegex = /^[+\d\s\-()]{10,20}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasPhone = formData.phone.trim() && phoneRegex.test(formData.phone.trim());
    const hasEmail = formData.email.trim() && emailRegex.test(formData.email.trim());
    if (!hasPhone && !hasEmail) {
      newErrors.contact = 'Укажите телефон или email';
    }
    if (formData.phone.trim() && !phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Некорректный формат телефона';
    }
    if (formData.email.trim() && !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Некорректный формат email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('submit_cta_form');
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const result = await submitForm({
        source: 'cta-homepage',
        name: formData.name.trim(),
        phone: formData.phone.trim() || '-',
        email: formData.email.trim() || undefined,
        pagePath: window.location.pathname,
      });
      if (result.tg || result.email) {
        setIsSuccess(true);
        setFormData({ name: '', phone: '', email: '' });
      } else {
        setErrors({ submit: 'Ошибка отправки. Попробуйте позже или позвоните нам.' });
      }
    } catch {
      setErrors({ submit: 'Ошибка отправки. Попробуйте позже или позвоните нам.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-green-400">
            <path d="m20 6-11 11-5-5"/>
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">Заявка отправлена!</h3>
        <p className="text-gray-400">Мы свяжемся с вами в ближайшее время</p>
        <button onClick={() => setIsSuccess(false)} className="mt-4 text-sm text-brand-400 hover:text-brand-300">
          Отправить ещё
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex-1 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Ваше имя"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-brand-500 focus:bg-white/10"
            />
            {errors.name && <p className="mt-1 text-left text-xs text-red-400">{errors.name}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <input
                type="tel"
                placeholder="Телефон"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-brand-500 focus:bg-white/10"
              />
              {errors.phone && <p className="mt-1 text-left text-xs text-red-400">{errors.phone}</p>}
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-brand-500 focus:bg-white/10"
              />
              {errors.email && <p className="mt-1 text-left text-xs text-red-400">{errors.email}</p>}
            </div>
          </div>
          {errors.contact && <p className="text-left text-xs text-red-400">{errors.contact}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !consent}
          className="btn-primary h-[52px] whitespace-nowrap px-8 disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Отправка...
            </span>
          ) : (
            'Обсудить'
          )}
        </button>
      </div>
      {errors.submit && <p className="mt-4 text-center text-sm text-red-400">{errors.submit}</p>}
      <ConsentCheckbox checked={consent} onChange={setConsent} className="mt-4" />
    </form>
  );
};

// ─── HomePage ─────────────────────────────────────────────────────────────────
const HomePage = () => {
  return (
    <div>
      <Helmet>
        <title>Фьючер Скрин — Техническое оснащение мероприятий | LED-экраны, звук, свет</title>
        <meta name="description" content="Аренда LED-экранов, звукового и светового оборудования в Екатеринбурге. Техническое сопровождение концертов, корпоративов, конференций с 2007 года." />
        <meta name="keywords" content="аренда led экранов, техническое оснащение мероприятий, аренда звука, аренда света, сценические конструкции, светодиодные экраны, Екатеринбург" />
      </Helmet>

      {/* ── 1. HERO — fullbleed photo ───────────────────────────────────────── */}
      <section
        className="relative flex h-screen items-center justify-center overflow-hidden -mt-16 lg:-mt-20"
        style={{
          backgroundImage: 'url(/images/hero-led-wall-2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay + gradient fade to site bg */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />

        <div className="container-page relative z-10 text-center pt-16 lg:pt-20">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-gray-200 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Работаем по всей России с 2007 года
          </div>

          {/* H1 */}
          <h1 className="font-display mb-6 text-balance text-5xl font-bold leading-tight text-white drop-shadow-lg md:text-7xl lg:text-8xl">
            Аренда LED-экранов,{' '}
            <span className="gradient-text">звука, света</span>
            <br />и сцены
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg leading-relaxed text-gray-200 md:text-xl">
            Техническое обеспечение корпоративов, концертов, конференций и выставок любого масштаба
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
              <div key={stat.label} className="rounded-2xl border border-white/15 bg-black/30 p-4 text-center backdrop-blur-sm">
                <div className="font-display gradient-text text-3xl font-bold md:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. OUR WORK — photo cards ─────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-[#0a0a0a]">
        <div className="container-page">
          <RevealSection>
            <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
                  Наши работы
                </div>
                <h2 className="font-display text-balance text-4xl font-bold text-white md:text-5xl">
                  Мероприятия,{' '}
                  <span className="gradient-text">которые мы делали</span>
                </h2>
              </div>
              <Link to="/cases" className="text-brand-400 hover:text-brand-300 transition-colors text-sm font-medium whitespace-nowrap">
                Все кейсы →
              </Link>
            </div>
          </RevealSection>

          <RevealSection className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { src: '/images/hero-concert.png', tag: 'Концертная сцена', title: 'Фестиваль живой музыки' },
              { src: '/images/gala-event.png', tag: 'Корпоратив', title: 'Ежегодный Гала-ужин' },
              { src: '/images/festival-crowd.png', tag: 'Open-air', title: 'Музыкальный фестиваль' },
            ].map((item) => (
              <div key={item.title} className="group relative rounded-2xl overflow-hidden cursor-pointer" style={{ aspectRatio: '4/5' }}>
                <img
                  src={item.src}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 transform translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
                  <p className="text-[#667eea] font-medium mb-1 uppercase tracking-wider text-xs">{item.tag}</p>
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                </div>
              </div>
            ))}
          </RevealSection>
        </div>
      </section>

      {/* ── 3. EQUIPMENT ──────────────────────────────────────────────────── */}
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

          <RevealSection className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {equipment.map((item) => (
              <Link
                key={item.title}
                to={item.link}
                className="group relative overflow-hidden rounded-2xl min-h-[300px] flex flex-col justify-end p-6 cursor-pointer"
              >
                {/* Photo background */}
                <img
                  src={item.photo!}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Dark gradient overlay — stronger at bottom for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                {/* Content */}
                <div className="relative z-10">
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white"
                    style={{ background: item.gradient }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="font-display mb-1 text-lg font-semibold text-white group-hover:text-brand-300 transition-colors">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-300 mb-3">{item.desc}</p>
                  <ul className="space-y-1">
                    {item.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: item.gradient }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            ))}
          </RevealSection>

          <RevealSection className="mt-5 grid gap-5 sm:grid-cols-3">
            {extraEquipment.map((item) => (
              <Link key={item.title} to={item.link} className="card flex items-start gap-4 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-gray-400 group-hover:border-brand-500/40 group-hover:text-brand-300 transition-colors">
                  {item.icon}
                </div>
                <div>
                  <div className="font-medium text-white group-hover:text-brand-300 transition-colors">{item.title}</div>
                  <div className="mt-1 text-sm text-gray-400">{item.desc}</div>
                </div>
              </Link>
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
                <div className="absolute inset-0 transition-opacity duration-300" style={{ background: item.gradient }} />
                <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-black/20" />
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
            <div
              className="absolute left-0 right-0 top-10 hidden h-px md:block"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(102,126,234,0.4), transparent)' }}
            />
            {processSteps.map((step) => (
              <div key={step.num} className="card relative h-full text-center">
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
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.25) 0%, rgba(118,75,162,0.25) 100%)' }}
              />
              <div className="absolute inset-0" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'inherit' }} />
              <div
                className="animate-pulse-slow absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30"
                style={{ background: 'radial-gradient(circle, rgba(102,126,234,0.6) 0%, transparent 70%)', filter: 'blur(60px)' }}
              />
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
                <CtaForm />
              </div>
            </div>
          </RevealSection>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
