import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getGlobalContent } from '../content/global';
import { useI18n } from '../context/I18nContext';
import { trackEvent } from '../lib/analytics';
import { submitForm } from '../lib/submitForm';
import { ConsentCheckbox } from './ConsentCheckbox';

const createSchema = (content: ReturnType<typeof getGlobalContent>['requestFormContent']) =>
  z.object({
    name: z.string().min(1, content.validation.nameRequired),
    phone: z.string().min(5, content.validation.phoneRequired),
    email: z
      .string()
      .email(content.validation.invalidEmail)
      .optional()
      .or(z.literal('')),
    telegram: z.string().optional(),
    city: z.string().optional(),
    date: z.string().optional(),
    format: z.string().optional(),
    comment: z.string().optional(),
    honey: z.string().max(0).optional(),
  });

type FormValues = z.infer<ReturnType<typeof createSchema>>;

type Props = {
  title?: string;
  subtitle?: string;
  ctaText?: string;
};

export const RequestForm = ({
  title,
  subtitle,
  ctaText,
}: Props) => {
  const { siteLocale } = useI18n();
  const { requestFormContent } = getGlobalContent(siteLocale);
  const schema = createSchema(requestFormContent);

  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [consent, setConsent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const resolvedTitle = title ?? requestFormContent.defaults.title;
  const resolvedCtaText = ctaText ?? requestFormContent.defaults.ctaText;

  const onSubmit = async (values: FormValues) => {
    if (values.honey) return;

    setSubmitError(null);
    trackEvent('submit_form', { pagePath: window.location.pathname, ...values });

    const result = await submitForm({
      source: `${requestFormContent.sourcePrefix} (${window.location.pathname})`,
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
      setSubmitError(requestFormContent.submitError);
      return;
    }

    setSent(true);
    reset();
    setShowMoreFields(false);
  };

  return (
    <div className="card">
      <div className="mb-4 space-y-1">
        <h3 className="text-xl font-semibold text-white">{resolvedTitle}</h3>
        {subtitle ? <p className="text-sm text-slate-300">{subtitle}</p> : null}
      </div>

      <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
        <input type="text" className="hidden" tabIndex={-1} autoComplete="off" {...register('honey')} />

        <label className="space-y-1 text-sm text-slate-200">
          {requestFormContent.fields.emailLabel}
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            placeholder={requestFormContent.fields.emailPlaceholder}
            {...register('email')}
          />
          {errors.email ? <span className="text-xs text-red-400">{errors.email.message}</span> : null}
        </label>

        <div className="grid gap-2 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-200">
            {requestFormContent.fields.nameLabel}
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              placeholder={requestFormContent.fields.namePlaceholder}
              {...register('name')}
            />
            {errors.name ? <span className="text-xs text-red-400">{errors.name.message}</span> : null}
          </label>

          <label className="space-y-1 text-sm text-slate-200">
            {requestFormContent.fields.phoneLabel}
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              placeholder={requestFormContent.fields.phonePlaceholder}
              {...register('phone')}
            />
            {errors.phone ? <span className="text-xs text-red-400">{errors.phone.message}</span> : null}
          </label>
        </div>

        <button
          type="button"
          onClick={() => setShowMoreFields((value) => !value)}
          className="flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 text-xs">
            {showMoreFields ? '−' : '+'}
          </span>
          {showMoreFields
            ? requestFormContent.fields.moreFieldsHide
            : requestFormContent.fields.moreFieldsShow}
        </button>

        {showMoreFields ? (
          <div className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-200">
                {requestFormContent.fields.telegramLabel}
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  placeholder={requestFormContent.fields.telegramPlaceholder}
                  {...register('telegram')}
                />
              </label>

              <label className="space-y-1 text-sm text-slate-200">
                {requestFormContent.fields.cityLabel}
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  placeholder={requestFormContent.fields.cityPlaceholder}
                  {...register('city')}
                />
              </label>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-200">
                {requestFormContent.fields.dateLabel}
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  placeholder={requestFormContent.fields.datePlaceholder}
                  {...register('date')}
                />
              </label>

              <label className="space-y-1 text-sm text-slate-200">
                {requestFormContent.fields.formatLabel}
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  placeholder={requestFormContent.fields.formatPlaceholder}
                  {...register('format')}
                />
              </label>
            </div>

            <label className="space-y-1 text-sm text-slate-200">
              {requestFormContent.fields.commentLabel}
              <textarea
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                rows={3}
                placeholder={requestFormContent.fields.commentPlaceholder}
                {...register('comment')}
              />
            </label>
          </div>
        ) : null}

        <ConsentCheckbox checked={consent} onChange={setConsent} className="mt-2" />

        <button
          type="submit"
          disabled={isSubmitting || !consent}
          className="flex items-center justify-center rounded-lg bg-brand-500 px-4 py-3 font-semibold text-white transition hover:bg-brand-400 disabled:opacity-60"
        >
          {isSubmitting ? requestFormContent.submitPending : resolvedCtaText}
        </button>

        {submitError ? <div className="text-sm text-red-400">{submitError}</div> : null}
        {sent ? <div className="text-sm text-emerald-300">{requestFormContent.submitSuccess}</div> : null}
      </form>
    </div>
  );
};
