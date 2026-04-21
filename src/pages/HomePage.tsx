import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { trackEvent } from '../lib/analytics';
import { submitForm } from '../lib/submitForm';
import { ConsentCheckbox } from '../components/ConsentCheckbox';
import { useI18n } from '../context/I18nContext';
import { getHomePageContent, type HomeIconKey } from '../content/pages/home';
import { useHomeEquipmentSection } from '../hooks/useHomeEquipmentSection';
import { useHomeHero } from '../hooks/useHomeHero';
import { useEditableBinding } from '../hooks/useEditableBinding';
import type { HomeEquipmentSectionContent } from '../lib/content/homeEquipmentSection';
import type { HomeHeroContent, HomeHeroStat } from '../lib/content/homeHero';

// Scroll reveal hook
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

const homeIcons: Record<HomeIconKey, JSX.Element> = {
  led: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <rect width="20" height="15" x="2" y="3" rx="2" />
      <path d="m8 21 4-4 4 4" />
      <path d="M9 17h6" />
    </svg>
  ),
  panel: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <rect width="20" height="15" x="2" y="3" rx="2" />
      <path d="m8 21 4-4 4 4" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  sound: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  ),
  light: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  ),
  stage: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  computer: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
    </svg>
  ),
  touch: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
      <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
      <path d="M10 10.5a2 2 0 0 0-2-2a2 2 0 0 0-2 2V19a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-5a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
    </svg>
  ),
  staff: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  corporate: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  concert: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12" />
      <circle cx="17" cy="7" r="5" />
    </svg>
  ),
  conference: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  ),
  wedding: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  exhibition: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v8h4" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11h-4" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  ),
  presentation: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  ),
  festival: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <path d="M12 2v8" />
      <path d="m4.93 10.93 1.41 1.41" />
      <path d="M2 18h2" />
      <path d="M20 18h2" />
      <path d="m19.07 10.93-1.41 1.41" />
      <path d="M22 22H2" />
      <path d="m8 22 4-10 4 10" />
      <path d="M2 22V12a10 10 0 0 1 20 0v10" />
    </svg>
  ),
  promo: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  theater: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
  sports: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
};

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type HomeWorkItem = {
  src: string;
  tag: string;
  title: string;
};

// Works slider
function WorksSlider({ items, prevLabel, nextLabel }: { items: readonly HomeWorkItem[]; prevLabel: string; nextLabel: string }) {
  const [shuffled] = useState(() => shuffle(items));
  const n = shuffled.length;
  const all = [...shuffled, ...shuffled, ...shuffled];
  const [visible, setVisible] = useState(3);
  const [idx, setIdxState] = useState(n);
  const idxRef = useRef(n);
  const [animated, setAnimated] = useState(true);
  const [hovered, setHovered] = useState(false);

  const setIdx = (val: number) => { idxRef.current = val; setIdxState(val); };

  useEffect(() => {
    const update = () =>
      setVisible(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const go = (dir: 1 | -1) => { const next = idxRef.current + dir; setIdx(next); };

  const handleTransitionEnd = () => {
    const cur = idxRef.current;
    if (cur >= n * 2) {
      setAnimated(false);
      setIdx(cur - n);
      setTimeout(() => setAnimated(true), 20);
    } else if (cur < n) {
      setAnimated(false);
      setIdx(cur + n);
      setTimeout(() => setAnimated(true), 20);
    }
  };

  const translatePct = -(idx / all.length) * 100;

  return (
    <div
      className="relative rounded-2xl"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex"
          style={{
            width: `${(all.length / visible) * 100}%`,
            transform: `translateX(${translatePct}%)`,
            transition: animated ? 'transform 0.45s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {all.map((item, i) => (
            <div
              key={i}
              className="group relative overflow-hidden cursor-pointer px-2"
              style={{ width: `${100 / all.length}%` }}
            >
              <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '4/5' }}>
                <img
                  src={item.src}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5 transform translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
                  <p className="text-brand-400 font-medium mb-1 uppercase tracking-wider text-xs">{item.tag}</p>
                  <h3 className="text-lg font-bold text-white leading-tight">{item.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Left arrow */}
      <button
        onClick={() => go(-1)}
        aria-label={prevLabel}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-black/70 border border-white/20 text-white transition-all duration-200 hover:bg-brand-600 hover:border-brand-500 hover:scale-110"
        style={{ opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      {/* Right arrow */}
      <button
        onClick={() => go(1)}
        aria-label={nextLabel}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-black/70 border border-white/20 text-white transition-all duration-200 hover:bg-brand-600 hover:border-brand-500 hover:scale-110"
        style={{ opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    </div>
  );
}

// Event types slider
type EventItem = {
  iconKey: HomeIconKey;
  title: string;
  desc: string;
  photo: string;
};

function EventsSlider({ items, prevLabel, nextLabel }: { items: readonly EventItem[]; prevLabel: string; nextLabel: string }) {
  const [shuffled] = useState(() => shuffle(items));
  const n = shuffled.length;
  const all = [...shuffled, ...shuffled, ...shuffled];
  const [visible, setVisible] = useState(3);
  const [idx, setIdxState] = useState(n);
  const idxRef = useRef(n);
  const [animated, setAnimated] = useState(true);
  const [hovered, setHovered] = useState(false);

  const setIdx = (val: number) => { idxRef.current = val; setIdxState(val); };

  useEffect(() => {
    const update = () =>
      setVisible(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const go = (dir: 1 | -1) => { const next = idxRef.current + dir; setIdx(next); };

  const handleTransitionEnd = () => {
    const cur = idxRef.current;
    if (cur >= n * 2) {
      setAnimated(false);
      setIdx(cur - n);
      setTimeout(() => setAnimated(true), 20);
    } else if (cur < n) {
      setAnimated(false);
      setIdx(cur + n);
      setTimeout(() => setAnimated(true), 20);
    }
  };

  const translatePct = -(idx / all.length) * 100;

  const arrowBtn = 'absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-black/70 border border-white/20 text-white transition-all duration-200 hover:bg-brand-600 hover:border-brand-500 hover:scale-110';

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex"
          style={{
            width: `${(all.length / visible) * 100}%`,
            transform: `translateX(${translatePct}%)`,
            transition: animated ? 'transform 0.45s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {all.map((item, i) => (
            <div
              key={i}
              className="group relative overflow-hidden cursor-pointer px-2"
              style={{ width: `${100 / all.length}%` }}
            >
              <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '4/3' }}>
                <img
                  src={item.photo}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ filter: 'saturate(0.5) brightness(0.6)' }}
                />
                <div className="absolute inset-0 bg-black/50 transition-colors duration-300 group-hover:bg-black/25" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                  <div className="mb-3 opacity-80 group-hover:opacity-100 transition-opacity">{homeIcons[item.iconKey]}</div>
                  <h3 className="font-display text-xl font-bold">{item.title}</h3>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                  <p className="text-xs leading-relaxed text-gray-200 opacity-0 transition-opacity duration-300 group-hover:opacity-90">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => go(-1)}
        aria-label={prevLabel}
        className={`${arrowBtn} left-3`}
        style={{ opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      <button
        onClick={() => go(1)}
        aria-label={nextLabel}
        className={`${arrowBtn} right-3`}
        style={{ opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    </div>
  );
}

// Section wrapper with scroll reveal
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

type CtaFormContent = ReturnType<typeof getHomePageContent>['ctaForm'];

// CTA form
const CtaForm = ({ ctaForm }: { ctaForm: CtaFormContent }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [consent, setConsent] = useState(false);
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = ctaForm.errors.name;
    }
    const phoneRegex = /^[+\d\s\-()]{10,20}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasPhone = formData.phone.trim() && phoneRegex.test(formData.phone.trim());
    const hasEmail = formData.email.trim() && emailRegex.test(formData.email.trim());
    if (!hasPhone && !hasEmail) {
      newErrors.contact = ctaForm.errors.contact;
    }
    if (formData.phone.trim() && !phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = ctaForm.errors.phone;
    }
    if (formData.email.trim() && !emailRegex.test(formData.email.trim())) {
      newErrors.email = ctaForm.errors.email;
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
        setErrors({ submit: ctaForm.errors.submit });
      }
    } catch {
      setErrors({ submit: ctaForm.errors.submit });
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
        <h3 className="mb-2 text-lg font-semibold text-white">{ctaForm.success.title}</h3>
        <p className="text-gray-400">{ctaForm.success.subtitle}</p>
        <button onClick={() => setIsSuccess(false)} className="mt-4 text-sm text-brand-400 hover:text-brand-300">
          {ctaForm.success.reset}
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
              placeholder={ctaForm.placeholders.name}
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
                placeholder={ctaForm.placeholders.phone}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-brand-500 focus:bg-white/10"
              />
              {errors.phone && <p className="mt-1 text-left text-xs text-red-400">{errors.phone}</p>}
            </div>
            <div>
              <input
                type="email"
                placeholder={ctaForm.placeholders.email}
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
              {ctaForm.submit.loading}
            </span>
          ) : (
            ctaForm.submit.idle
          )}
        </button>
      </div>
      {errors.submit && <p className="mt-4 text-center text-sm text-red-400">{errors.submit}</p>}
      <ConsentCheckbox checked={consent} onChange={setConsent} className="mt-4" />
    </form>
  );
};

interface HeroStatCardProps {
  stat: HomeHeroStat;
  index: number;
  onSaveStat: (stat: HomeHeroStat) => Promise<void>;
}

const HeroStatCard = ({ stat, index, onSaveStat }: HeroStatCardProps) => {
  const valueEdit = useEditableBinding({
    value: stat.value,
    onSave: (next) => onSaveStat({ ...stat, value: next }),
    label: `Hero stat ${index + 1} — value`,
  });
  const labelEdit = useEditableBinding({
    value: stat.label,
    onSave: (next) => onSaveStat({ ...stat, label: next }),
    label: `Hero stat ${index + 1} — label`,
  });
  return (
    <div className="rounded-2xl border border-white/15 bg-black/30 p-4 text-center backdrop-blur-sm">
      <div className="font-display gradient-text text-3xl font-bold md:text-4xl">
        <span {...valueEdit.bindProps}>{valueEdit.value}</span>
      </div>
      <div className="mt-1 text-sm text-gray-300">
        <span {...labelEdit.bindProps}>{labelEdit.value}</span>
      </div>
    </div>
  );
};

// Home page
const HomePage = () => {
  const { siteLocale } = useI18n();
  const homePageContent = getHomePageContent(siteLocale);
  const { data: equipmentSectionOverride, save: saveEquipmentSection } =
    useHomeEquipmentSection(siteLocale, true);
  const { data: hero, save: saveHero } = useHomeHero(siteLocale, true);
  const { seo, works, equipmentSection, eventTypesSection, processSection, ctaSection } =
    homePageContent;
  const effectiveEquipmentSection = equipmentSectionOverride ?? equipmentSection;
  const equipment = effectiveEquipmentSection.items;
  const extraEquipment = effectiveEquipmentSection.extraItems;

  // Inline-edit bindings for the Equipment section header (admin-only in
  // edit mode; inert for everyone else).
  const makeEqFieldSaver = (field: keyof HomeEquipmentSectionContent) => async (next: string) => {
    const base = equipmentSectionOverride ?? effectiveEquipmentSection;
    const ok = await saveEquipmentSection({ ...base, [field]: next });
    if (!ok) throw new Error('Failed to save equipment section');
  };

  const eqBadgeEdit = useEditableBinding({
    value: effectiveEquipmentSection.badge,
    onSave: makeEqFieldSaver('badge'),
    label: 'Equipment section — badge',
  });
  const eqTitleEdit = useEditableBinding({
    value: effectiveEquipmentSection.title,
    onSave: makeEqFieldSaver('title'),
    label: 'Equipment section — title',
  });
  const eqAccentTitleEdit = useEditableBinding({
    value: effectiveEquipmentSection.accentTitle,
    onSave: makeEqFieldSaver('accentTitle'),
    label: 'Equipment section — accent title',
  });
  const eqSubtitleEdit = useEditableBinding({
    value: effectiveEquipmentSection.subtitle,
    onSave: makeEqFieldSaver('subtitle'),
    label: 'Equipment section — subtitle',
    kind: 'multiline',
  });

  // Hero (migrated from bundled content to site_content.home_hero in Phase 5a).
  const saveHeroField = async (patch: Partial<HomeHeroContent>) => {
    const ok = await saveHero({ ...hero, ...patch });
    if (!ok) throw new Error('Failed to save hero');
  };
  const heroBadgeEdit = useEditableBinding({
    value: hero.badge,
    onSave: (next) => saveHeroField({ badge: next }),
    label: 'Hero — badge',
  });
  const heroLine0Edit = useEditableBinding({
    value: hero.titleLines[0] ?? '',
    onSave: (next) =>
      saveHeroField({ titleLines: [next, hero.titleLines[1] ?? '', hero.titleLines[2] ?? ''] }),
    label: 'Hero — title line 1',
  });
  const heroLine1Edit = useEditableBinding({
    value: hero.titleLines[1] ?? '',
    onSave: (next) =>
      saveHeroField({ titleLines: [hero.titleLines[0] ?? '', next, hero.titleLines[2] ?? ''] }),
    label: 'Hero — title line 2 (accent)',
  });
  const heroLine2Edit = useEditableBinding({
    value: hero.titleLines[2] ?? '',
    onSave: (next) =>
      saveHeroField({ titleLines: [hero.titleLines[0] ?? '', hero.titleLines[1] ?? '', next] }),
    label: 'Hero — title line 3',
  });
  const heroSubtitleEdit = useEditableBinding({
    value: hero.subtitle,
    onSave: (next) => saveHeroField({ subtitle: next }),
    label: 'Hero — subtitle',
    kind: 'multiline',
  });
  const heroPrimaryCtaEdit = useEditableBinding({
    value: hero.primaryCta,
    onSave: (next) => saveHeroField({ primaryCta: next }),
    label: 'Hero — primary CTA',
  });
  const heroSecondaryCtaEdit = useEditableBinding({
    value: hero.secondaryCta,
    onSave: (next) => saveHeroField({ secondaryCta: next }),
    label: 'Hero — secondary CTA',
  });

  const eventTypes = eventTypesSection.items;
  const processSteps = processSection.steps;
  const worksItems = works.items;

  return (
    <div>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta name="keywords" content={seo.keywords} />
      </Helmet>

      {/* Hero */}
      <section
        className="relative flex h-screen items-center justify-center overflow-hidden -mt-16 lg:-mt-20"
        style={{
          backgroundImage: 'url(/images/hero-led-wall-2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay and gradient fade to site background */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />

        <div className="container-page relative z-10 text-center pt-16 lg:pt-20">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-gray-200 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span {...heroBadgeEdit.bindProps}>{heroBadgeEdit.value}</span>
          </div>

          {/* Title */}
          <h1 className="font-display mb-6 text-balance text-5xl font-bold leading-tight text-white drop-shadow-lg md:text-7xl lg:text-8xl">
            <span {...heroLine0Edit.bindProps}>{heroLine0Edit.value}</span>
            <br />
            <span className="gradient-text" {...heroLine1Edit.bindProps}>
              {heroLine1Edit.value}
            </span>
            <br />
            <span {...heroLine2Edit.bindProps}>{heroLine2Edit.value}</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg leading-relaxed text-gray-200 md:text-xl">
            <span {...heroSubtitleEdit.bindProps}>{heroSubtitleEdit.value}</span>
          </p>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#contacts"
              onClick={(e) => { e.preventDefault(); document.getElementById('contacts')?.scrollIntoView({ behavior: 'smooth' }); trackEvent('click_cta_hero'); }}
              className="btn-primary text-base"
            >
              <span {...heroPrimaryCtaEdit.bindProps}>{heroPrimaryCtaEdit.value}</span>
            </a>
            <Link to="/cases" className="btn-secondary text-base">
              <span {...heroSecondaryCtaEdit.bindProps}>{heroSecondaryCtaEdit.value}</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
            {hero.stats.map((stat, i) => (
              <HeroStatCard
                key={`${stat.label}-${i}`}
                stat={stat}
                index={i}
                onSaveStat={async (nextStat) => {
                  const nextStats = [...hero.stats];
                  nextStats[i] = nextStat;
                  await saveHeroField({ stats: nextStats });
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Our work */}
      <section className="py-24 md:py-32 bg-[#0a0a0a]">
        <div className="container-page">
          <RevealSection>
            <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
                  {works.badge}
                </div>
                <h2 className="font-display text-balance text-4xl font-bold text-white md:text-5xl">
                  {works.title}{' '}
                  <span className="gradient-text">{works.accentTitle}</span>
                </h2>
              </div>
              <Link to="/cases" className="text-brand-400 hover:text-brand-300 transition-colors text-sm font-medium whitespace-nowrap">
                {works.allCasesLink}
              </Link>
            </div>
          </RevealSection>

          <RevealSection>
            <WorksSlider items={worksItems} prevLabel={works.prevLabel} nextLabel={works.nextLabel} />
          </RevealSection>
        </div>
      </section>

      {/* Equipment */}
      <section id="equipment" className="py-24 md:py-32">
        <div className="container-page">
          <RevealSection>
            <div className="mb-12 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
                <span {...eqBadgeEdit.bindProps}>{eqBadgeEdit.value}</span>
              </div>
              <h2 className="font-display mb-4 text-balance text-4xl font-bold text-white md:text-5xl">
                <span {...eqTitleEdit.bindProps}>{eqTitleEdit.value}</span>{' '}
                <span className="gradient-text" {...eqAccentTitleEdit.bindProps}>
                  {eqAccentTitleEdit.value}
                </span>
              </h2>
              <p className="mx-auto max-w-2xl text-gray-400">
                <span {...eqSubtitleEdit.bindProps}>{eqSubtitleEdit.value}</span>
              </p>
            </div>
          </RevealSection>

          <RevealSection className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {equipment.map((item) => (
              <Link
                key={item.title}
                to={item.link}
                className="group relative overflow-hidden rounded-2xl min-h-[300px] block cursor-pointer"
              >
                {/* Photo background */}
                <img
                  src={item.photo!}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                {/* Content anchored to the bottom */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-6">
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white"
                    style={{ background: item.gradient }}
                  >
                    {homeIcons[item.iconKey as HomeIconKey]}
                  </div>
                  <h3 className="font-display mb-1 text-lg font-semibold text-white group-hover:text-brand-300 transition-colors">{item.title}</h3>
                  <p className="line-clamp-2 text-sm leading-relaxed text-gray-300 mb-3">{item.desc}</p>
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
              <Link key={item.title} to={item.link} className="group relative overflow-hidden rounded-2xl min-h-[120px] block cursor-pointer">
                <img
                  src={item.photo}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/65 group-hover:bg-black/55 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-3 p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white group-hover:bg-brand-500/30 transition-colors">
                    {homeIcons[item.iconKey as HomeIconKey]}
                  </div>
                  <div>
                    <div className="font-medium text-white group-hover:text-brand-300 transition-colors leading-tight">{item.title}</div>
                    <div className="text-xs text-gray-400 line-clamp-1">{item.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </RevealSection>
        </div>
      </section>

      {/* Event types */}
      <section id="services" className="py-24 md:py-32">
        <div className="container-page">
          <RevealSection>
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
                {eventTypesSection.badge}
              </div>
              <h2 className="font-display mb-4 text-balance text-4xl font-bold text-white md:text-5xl">
                {eventTypesSection.title}{' '}
                <span className="gradient-text">{eventTypesSection.accentTitle}</span>
              </h2>
            </div>
          </RevealSection>

          <RevealSection>
            <EventsSlider items={eventTypes} prevLabel={eventTypesSection.prevLabel} nextLabel={eventTypesSection.nextLabel} />
          </RevealSection>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 md:py-32">
        <div className="container-page">
          <RevealSection>
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
                {processSection.badge}
              </div>
              <h2 className="font-display mb-4 text-balance text-4xl font-bold text-white md:text-5xl">
                {processSection.title}{' '}
                <span className="gradient-text">{processSection.accentTitle}</span>
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

      {/* CTA */}
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
                  {ctaSection.title}{' '}
                  <span className="gradient-text">{ctaSection.accentTitle}</span>
                </h2>
                <p className="mx-auto mb-8 max-w-xl text-gray-400">
                  {ctaSection.subtitle}
                </p>
                <CtaForm ctaForm={homePageContent.ctaForm} />
              </div>
            </div>
          </RevealSection>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
