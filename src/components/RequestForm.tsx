import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { trackEvent } from '../lib/analytics';
import { submitForm } from '../lib/submitForm';
import { useState } from 'react';

const schema = z.object({
  name: z.string().min(1, 'Укажите имя'),
  phone: z.string().min(5, 'Укажите телефон'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  telegram: z.string().optional(),
  city: z.string().optional(),
  date: z.string().optional(),
  format: z.string().optional(),
  comment: z.string().optional(),
  honey: z.string().max(0).optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  title?: string;
  subtitle?: string;
  ctaText?: string;
};

export const RequestForm = ({ title = 'Запросить КП', subtitle, ctaText = 'Отправить' }: Props) => {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    if (values.honey) return;
    setSubmitError(null);
    trackEvent('submit_form', { pagePath: window.location.pathname, ...values });
    const result = await submitForm({
      source: `Форма КП (${window.location.pathname})`,
      name: values.name,
      phone: values.phone,
      email: values.email,
      telegram: values.telegram,
      city: values.city,
      date: values.date,
      format: values.format,
      comment: values.comment,
    });

    if (!result.tg && !result.email) {
      setSubmitError('Не удалось отправить заявку. Проверьте соединение или попробуйте позже.');
      return;
    }

    setSent(true);
    reset();
  };

  return (
    <div className="card">
      <div className="mb-4 space-y-1">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-slate-300">{subtitle}</p>}
      </div>
      <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
        <input type="text" className="hidden" tabIndex={-1} autoComplete="off" {...register('honey')} />
        <div className="grid gap-2 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-200">
            Имя*
            <input className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" placeholder="Имя" {...register('name')} />
            {errors.name && <span className="text-xs text-red-400">{errors.name.message}</span>}
          </label>
          <label className="space-y-1 text-sm text-slate-200">
            Телефон*
            <input className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" placeholder="+7" {...register('phone')} />
            {errors.phone && <span className="text-xs text-red-400">{errors.phone.message}</span>}
          </label>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-200">
            Email
            <input className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" placeholder="example@mail.ru" {...register('email')} />
            {errors.email && <span className="text-xs text-red-400">{errors.email.message}</span>}
          </label>
          <label className="space-y-1 text-sm text-slate-200">
            Telegram
            <input className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" placeholder="@username" {...register('telegram')} />
          </label>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-200">
            Город
            <input className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" placeholder="Екатеринбург" {...register('city')} />
          </label>
          <label className="space-y-1 text-sm text-slate-200">
            Дата/период
            <input className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" placeholder="25–27 мая" {...register('date')} />
          </label>
        </div>
        <label className="space-y-1 text-sm text-slate-200">
          Формат
          <input className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" placeholder="Форум, концерт, выставка..." {...register('format')} />
        </label>
        <label className="space-y-1 text-sm text-slate-200">
          Комментарий
          <textarea className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" rows={3} placeholder="Кратко опишите задачу" {...register('comment')} />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center rounded-lg bg-brand-500 px-4 py-3 font-semibold text-white transition hover:bg-brand-400 disabled:opacity-60"
        >
          {isSubmitting ? 'Отправляем...' : ctaText}
        </button>
        {submitError && <div className="text-sm text-red-400">{submitError}</div>}
        {sent && <div className="text-sm text-emerald-300">Спасибо! Мы свяжемся в течение 15 минут.</div>}
      </form>
    </div>
  );
};
