import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useI18n } from '../context/I18nContext';
import { trackEvent } from '../lib/analytics';
import { submitForm } from '../lib/submitForm';
import { ConsentCheckbox } from './ConsentCheckbox';
import { useGlobalRequestForm } from '../hooks/useGlobalRequestForm';
import { useEditableBinding } from '../hooks/useEditableBinding';
import type { GlobalRequestFormContent } from '../lib/content/globalRequestForm';

interface EditableLabelProps {
  value: string;
  onSave: (next: string) => Promise<void>;
  label: string;
}

const EditableLabel = ({ value, onSave, label }: EditableLabelProps) => {
  const edit = useEditableBinding({ value, onSave, label });
  return <span {...edit.bindProps}>{edit.value}</span>;
};

const createSchema = (content: GlobalRequestFormContent) =>
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
  const { data: requestFormContent, save: saveRequestForm } = useGlobalRequestForm(siteLocale, true);
  const schema = createSchema(requestFormContent);

  const savePatch = async (patch: Partial<GlobalRequestFormContent>) => {
    const ok = await saveRequestForm({ ...requestFormContent, ...patch });
    if (!ok) throw new Error('Failed to save request form');
  };
  const saveFieldLabel =
    (fieldKey: keyof GlobalRequestFormContent['fields']) => async (next: string) => {
      await savePatch({ fields: { ...requestFormContent.fields, [fieldKey]: next } });
    };

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
    // H2: never send PII (name/phone/email/telegram/comment) to analytics.
    // Only emit the structural fields that help segment conversions.
    trackEvent('submit_form', {
      pagePath: window.location.pathname,
      city: values.city,
      date: values.date,
      format: values.format,
      has_telegram: Boolean(values.telegram),
      has_comment: Boolean(values.comment),
      more_fields_shown: showMoreFields,
    });

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
        <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
          Company website
          <input type="text" tabIndex={-1} autoComplete="off" {...register('honey')} />
        </label>

        <label className="space-y-1 text-sm text-slate-200">
          <EditableLabel
            value={requestFormContent.fields.emailLabel}
            onSave={saveFieldLabel('emailLabel')}
            label="Form — email label"
          />
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            placeholder={requestFormContent.fields.emailPlaceholder}
            {...register('email')}
          />
          {errors.email ? <span className="text-xs text-red-400">{errors.email.message}</span> : null}
        </label>

        <div className="grid gap-2 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-200">
            <EditableLabel
              value={requestFormContent.fields.nameLabel}
              onSave={saveFieldLabel('nameLabel')}
              label="Form — name label"
            />
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              placeholder={requestFormContent.fields.namePlaceholder}
              {...register('name')}
            />
            {errors.name ? <span className="text-xs text-red-400">{errors.name.message}</span> : null}
          </label>

          <label className="space-y-1 text-sm text-slate-200">
            <EditableLabel
              value={requestFormContent.fields.phoneLabel}
              onSave={saveFieldLabel('phoneLabel')}
              label="Form — phone label"
            />
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
          {showMoreFields ? (
            <EditableLabel
              value={requestFormContent.fields.moreFieldsHide}
              onSave={saveFieldLabel('moreFieldsHide')}
              label="Form — more fields (hide)"
            />
          ) : (
            <EditableLabel
              value={requestFormContent.fields.moreFieldsShow}
              onSave={saveFieldLabel('moreFieldsShow')}
              label="Form — more fields (show)"
            />
          )}
        </button>

        {showMoreFields ? (
          <div className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-200">
                <EditableLabel
                  value={requestFormContent.fields.telegramLabel}
                  onSave={saveFieldLabel('telegramLabel')}
                  label="Form — telegram label"
                />
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  placeholder={requestFormContent.fields.telegramPlaceholder}
                  {...register('telegram')}
                />
              </label>

              <label className="space-y-1 text-sm text-slate-200">
                <EditableLabel
                  value={requestFormContent.fields.cityLabel}
                  onSave={saveFieldLabel('cityLabel')}
                  label="Form — city label"
                />
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  placeholder={requestFormContent.fields.cityPlaceholder}
                  {...register('city')}
                />
              </label>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-200">
                <EditableLabel
                  value={requestFormContent.fields.dateLabel}
                  onSave={saveFieldLabel('dateLabel')}
                  label="Form — date label"
                />
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  placeholder={requestFormContent.fields.datePlaceholder}
                  {...register('date')}
                />
              </label>

              <label className="space-y-1 text-sm text-slate-200">
                <EditableLabel
                  value={requestFormContent.fields.formatLabel}
                  onSave={saveFieldLabel('formatLabel')}
                  label="Form — format label"
                />
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  placeholder={requestFormContent.fields.formatPlaceholder}
                  {...register('format')}
                />
              </label>
            </div>

            <label className="space-y-1 text-sm text-slate-200">
              <EditableLabel
                value={requestFormContent.fields.commentLabel}
                onSave={saveFieldLabel('commentLabel')}
                label="Form — comment label"
              />
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
