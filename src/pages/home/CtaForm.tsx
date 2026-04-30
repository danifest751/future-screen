import { useState } from 'react';
import { trackEvent } from '../../lib/analytics';
import { submitForm } from '../../lib/submitForm';
import { ConsentCheckbox } from '../../components/ConsentCheckbox';
import { useI18n } from '../../context/I18nContext';
import { useHomeCtaForm } from '../../hooks/useHomeCtaForm';
import { useEditableBinding } from '../../hooks/useEditableBinding';
import type { HomeCtaFormContent } from '../../lib/content/homeCtaForm';

// CTA form — content sourced from DB (home_cta_form) with inline
// editing on the visible button text + success panel. Placeholders and
// validation errors stay DB-backed but aren't inline-editable (HTML
// attribute / ephemeral state).
export const CtaForm = () => {
  const { siteLocale } = useI18n();
  const { data: ctaForm, save: saveCtaForm } = useHomeCtaForm(siteLocale, true);
  const saveCtaPatch = async (patch: Partial<HomeCtaFormContent>) => {
    const ok = await saveCtaForm({ ...ctaForm, ...patch });
    if (!ok) throw new Error('Failed to save CTA form content');
  };
  const submitIdleEdit = useEditableBinding({
    value: ctaForm.submit.idle,
    onSave: (next) => saveCtaPatch({ submit: { ...ctaForm.submit, idle: next } }),
    label: 'CTA form — submit button',
  });
  const successTitleEdit = useEditableBinding({
    value: ctaForm.success.title,
    onSave: (next) => saveCtaPatch({ success: { ...ctaForm.success, title: next } }),
    label: 'CTA form — success title',
  });
  const successSubtitleEdit = useEditableBinding({
    value: ctaForm.success.subtitle,
    onSave: (next) => saveCtaPatch({ success: { ...ctaForm.success, subtitle: next } }),
    label: 'CTA form — success subtitle',
  });
  const successResetEdit = useEditableBinding({
    value: ctaForm.success.reset,
    onSave: (next) => saveCtaPatch({ success: { ...ctaForm.success, reset: next } }),
    label: 'CTA form — success reset button',
  });

  const [formData, setFormData] = useState({ name: '', phone: '', email: '', honey: '' });
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
    if (formData.honey.trim()) return;
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const result = await submitForm({
        source: 'cta-homepage',
        name: formData.name.trim(),
        phone: formData.phone.trim() || '-',
        email: formData.email.trim() || undefined,
        honey: formData.honey,
        pagePath: window.location.pathname,
      });
      if (result.tg || result.email) {
        setIsSuccess(true);
        setFormData({ name: '', phone: '', email: '', honey: '' });
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
        <h3 className="mb-2 text-lg font-semibold text-white">
          <span {...successTitleEdit.bindProps}>{successTitleEdit.value}</span>
        </h3>
        <p className="text-gray-400">
          <span {...successSubtitleEdit.bindProps}>{successSubtitleEdit.value}</span>
        </p>
        <button onClick={() => setIsSuccess(false)} className="mt-4 text-sm text-brand-400 hover:text-brand-300">
          <span {...successResetEdit.bindProps}>{successResetEdit.value}</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
      <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
        Company website
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={formData.honey}
          onChange={(e) => setFormData({ ...formData, honey: e.target.value })}
        />
      </label>
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
            <span {...submitIdleEdit.bindProps}>{submitIdleEdit.value}</span>
          )}
        </button>
      </div>
      {errors.submit && <p className="mt-4 text-center text-sm text-red-400">{errors.submit}</p>}
      <ConsentCheckbox checked={consent} onChange={setConsent} className="mt-4" />
    </form>
  );
};
