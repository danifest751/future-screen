import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useOptionalEditMode } from '../../context/EditModeContext';
import { getRentalComponentContent } from '../../content/components/rental';
import { useI18n } from '../../context/I18nContext';
import { useEditableBinding } from '../../hooks/useEditableBinding';
import { RequestForm } from '../RequestForm';

export interface RentalCtaData {
  title?: string;
  text?: string;
  primaryCta?: string;
  primaryCtaLink?: string;
  secondaryCta?: string;
  secondaryCtaLink?: string;
}

interface RentalCtaProps {
  data: RentalCtaData;
  showForm?: boolean;
  formCtaText?: string;
  onPatch?: (patch: Partial<RentalCtaData>) => Promise<void>;
}

const RentalCta = memo(function RentalCta({
  data,
  showForm = false,
  formCtaText,
  onPatch,
}: RentalCtaProps) {
  const { isEditing } = useOptionalEditMode();
  const { siteLocale } = useI18n();
  const rentalComponentContent = getRentalComponentContent(siteLocale);
  const formButtonText = formCtaText ?? rentalComponentContent.ctaFormButton;
  const { title, text, primaryCta, primaryCtaLink, secondaryCta, secondaryCtaLink } = data;
  const disabled = !onPatch;

  const titleEdit = useEditableBinding({
    value: title ?? '',
    onSave: async (next) => onPatch?.({ title: next }),
    label: 'Bottom CTA — title',
    disabled,
  });
  const textEdit = useEditableBinding({
    value: text ?? '',
    onSave: async (next) => onPatch?.({ text: next }),
    label: 'Bottom CTA — text',
    disabled,
    kind: 'multiline',
  });
  const primaryCtaEdit = useEditableBinding({
    value: primaryCta ?? '',
    onSave: async (next) => onPatch?.({ primaryCta: next }),
    label: 'Bottom CTA — primary CTA',
    disabled,
  });
  const secondaryCtaEdit = useEditableBinding({
    value: secondaryCta ?? '',
    onSave: async (next) => onPatch?.({ secondaryCta: next }),
    label: 'Bottom CTA — secondary CTA',
    disabled,
  });

  if (!title && !text && !showForm && !isEditing) {
    return null;
  }

  const hasPrimary = (primaryCta && primaryCtaLink) || isEditing;
  const hasSecondary = (secondaryCta && secondaryCtaLink) || isEditing;

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-transparent p-8 md:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand-600/10 blur-3xl" />

          <div className="relative max-w-2xl mx-auto text-center">
            {showForm && !isEditing ? (
              <RequestForm
                title={title || rentalComponentContent.ctaFallbackTitle}
                subtitle={text}
                ctaText={formButtonText}
              />
            ) : (
              <>
                {(title || isEditing) && (
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    <span {...titleEdit.bindProps}>{titleEdit.value}</span>
                  </h2>
                )}
                {(text || isEditing) && (
                  <p className="text-slate-300 mb-8 leading-relaxed">
                    <span {...textEdit.bindProps}>{textEdit.value}</span>
                  </p>
                )}
                {(hasPrimary || hasSecondary) && (
                  <div className="flex flex-wrap justify-center gap-4">
                    {hasPrimary && (
                      isEditing ? (
                        <span className="btn-primary">
                          <span {...primaryCtaEdit.bindProps}>
                            {primaryCtaEdit.value || '— CTA —'}
                          </span>
                        </span>
                      ) : primaryCtaLink ? (
                        <Link to={primaryCtaLink} className="btn-primary">
                          {primaryCta}
                        </Link>
                      ) : null
                    )}
                    {hasSecondary && (
                      isEditing ? (
                        <span className="btn-secondary">
                          <span {...secondaryCtaEdit.bindProps}>
                            {secondaryCtaEdit.value || '— secondary —'}
                          </span>
                        </span>
                      ) : secondaryCtaLink ? (
                        <Link to={secondaryCtaLink} className="btn-secondary">
                          {secondaryCta}
                        </Link>
                      ) : null
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
});

export { RentalCta };
export default RentalCta;
