import { FormEvent, useState } from 'react';
import type { CalcInputs, CalcResult } from '../../../data/calculatorConfig';
import { submitForm } from '../../../lib/submitForm';

interface Props {
  inputs: CalcInputs;
  result: CalcResult;
  open: boolean;
  onClose: () => void;
}

const LeadForm = ({ inputs, result, open, onClose }: Props) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setSending(true);

    await submitForm({
      source: 'Калькулятор LED',
      name,
      phone,
      email,
      telegram,
      city,
      date,
      comment,
      extra: {
        'Экран': `${result.width}×${result.height} м (${result.area} м²)`,
        'Шаг пикселя': result.pitch.label,
        'Дистанция': `${result.distance} м`,
        'Установка': result.installRecommendation,
        'Мощность': result.powerAvg,
        'Тип события': inputs.eventType,
        'Локация': inputs.location,
        'Аудитория': String(inputs.audience),
        'Назначение': inputs.purpose,
      },
    });
    setSending(false);
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="space-y-4 text-center">
            <div className="text-4xl">✅</div>
            <h3 className="text-xl font-bold text-white">Заявка отправлена!</h3>
            <p className="text-sm text-slate-400">
              Мы свяжемся с вами в течение 15 минут в рабочее время.
              <br />Подготовим точный расчёт под вашу площадку.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-400"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Получить КП</h3>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
              Экран {result.width}×{result.height} м · {result.pitch.label} · {result.area} м²
            </div>

            <label className="block text-sm text-slate-200">
              Имя *
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                placeholder="Как к вам обращаться"
              />
            </label>

            <label className="block text-sm text-slate-200">
              Телефон *
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                type="tel"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                placeholder="+7 (___) ___-__-__"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-200">
                Email
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                  placeholder="example@mail.ru"
                />
              </label>
              <label className="block text-sm text-slate-200">
                Telegram
                <input
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                  placeholder="@username"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-200">
                Город
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                  placeholder="Москва"
                />
              </label>
              <label className="block text-sm text-slate-200">
                Дата мероприятия
                <input
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                  placeholder="Примерно или точно"
                />
              </label>
            </div>

            <label className="block text-sm text-slate-200">
              Комментарий
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                placeholder="Дополнительные пожелания"
              />
            </label>

            <button
              type="submit"
              disabled={sending || !name.trim() || !phone.trim()}
              className="w-full rounded-xl bg-brand-500 px-6 py-3 font-bold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-400 disabled:opacity-50"
            >
              {sending ? 'Отправляем...' : 'Отправить заявку'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LeadForm;
