import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { Loader2, X } from 'lucide-react';
import { submitForm } from '../../lib/submitForm';
import { selectActivePreset, selectProjectEstimate, collectScreenDimensions } from './state/selectors';
import { useVisualLed } from './state/VisualLedContext';

export interface QuoteRequestModalProps {
  open: boolean;
  onClose: () => void;
}

const VISUAL_LED_SOURCE = 'visual-led-config';

/**
 * Final CTA modal for the Visual LED sales-configurator. Collects minimal
 * contact info and submits via the existing /api/send pipeline. The whole
 * project state (preset, screen count, area, price estimate) goes into
 * `extra` so the manager has context without opening the visualizer.
 */
const QuoteRequestModal = ({ open, onClose }: QuoteRequestModalProps) => {
  const { state } = useVisualLed();
  const estimate = selectProjectEstimate(state);
  const preset = selectActivePreset(state);
  const screens = collectScreenDimensions(state);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Focus name field on open for keyboard users.
      window.setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, open, submitting]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (!name.trim() || !phone.trim()) {
      toast.error('Заполните имя и телефон');
      return;
    }

    setSubmitting(true);
    try {
      const extra: Record<string, string> = {
        preset_slug: state.selectedPresetSlug ?? '__none__',
        preset_title: preset?.title.ru ?? 'Свой вариант',
        area_m2: estimate.areaM2.toFixed(2),
        screens_count: String(screens.length),
        price_from_rub: String(estimate.priceFrom),
        is_estimated: estimate.isEstimated ? 'true' : 'false',
      };

      const result = await submitForm({
        source: VISUAL_LED_SOURCE,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        city: city.trim() || undefined,
        comment: comment.trim() || undefined,
        extra,
        pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      });

      if (result.tg || result.email) {
        toast.success('Заявка отправлена. Менеджер свяжется в ближайшее время');
        setName('');
        setPhone('');
        setEmail('');
        setCity('');
        setComment('');
        onClose();
      } else {
        toast.error('Не удалось отправить. Позвоните по телефону или попробуйте позже');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Узнать точную стоимость</h2>
            <p className="mt-1 text-xs text-slate-400">
              Менеджер уточнит детали, посчитает доставку и монтаж.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Закрыть"
            className="rounded-lg border border-white/10 bg-slate-800 p-1.5 text-slate-300 hover:border-white/30 hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="space-y-3 overflow-y-auto p-5" onSubmit={handleSubmit}>
          <div className="rounded-lg border border-brand-500/30 bg-brand-500/5 px-3 py-2 text-xs text-brand-100">
            <div className="flex items-center justify-between gap-2">
              <span>{preset ? preset.title.ru : 'Свой вариант'}</span>
              <span className="text-slate-300">
                ≈ {estimate.areaM2.toFixed(estimate.areaM2 % 1 === 0 ? 0 : 1)} м² ·{' '}
                {estimate.priceFrom.toLocaleString('ru-RU')} ₽/день
              </span>
            </div>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">Имя *</span>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-slate-400">Телефон *</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                placeholder="+7 (___) ___-__-__"
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-slate-400">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">Город</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-400">Комментарий</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Дата мероприятия, площадка, особые требования…"
              className="w-full resize-none rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
            />
          </label>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
            <p className="text-[10px] text-slate-500">
              Нажимая «Отправить», вы соглашаетесь с обработкой персональных данных.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Отправляю…
                </>
              ) : (
                'Отправить заявку'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : null;
};

export default QuoteRequestModal;
