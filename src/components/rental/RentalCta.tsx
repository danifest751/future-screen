import { memo } from 'react';
import { Link } from 'react-router-dom';
import { getRentalComponentContent } from '../../content/components/rental';
import { useI18n } from '../../context/I18nContext';
import { RequestForm } from '../RequestForm';

interface RentalCtaProps {
  data: {
    title?: string;
    text?: string;
    primaryCta?: string;
    primaryCtaLink?: string;
    secondaryCta?: string;
    secondaryCtaLink?: string;
  };
  showForm?: boolean;
  formCtaText?: string;
}

const RentalCta = memo(function RentalCta({ data, showForm = false, formCtaText }: RentalCtaProps) {
  const { siteLocale } = useI18n();
  const rentalComponentContent = getRentalComponentContent(siteLocale);
  const formButtonText = formCtaText ?? rentalComponentContent.ctaFormButton;
  const { title, text, primaryCta, primaryCtaLink, secondaryCta, secondaryCtaLink } = data;

  if (!title && !text && !showForm) {
    return null;
  }

  const hasPrimary = primaryCta && primaryCtaLink;
  const hasSecondary = secondaryCta && secondaryCtaLink;

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-transparent p-8 md:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand-600/10 blur-3xl" />

          <div className="relative max-w-2xl mx-auto text-center">
            {showForm ? (
              <RequestForm
                title={title || rentalComponentContent.ctaFallbackTitle}
                subtitle={text}
                ctaText={formButtonText}
              />
            ) : (
              <>
                {title && (
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    {title}
                  </h2>
                )}

                {text && (
                  <p className="text-slate-300 mb-8 leading-relaxed">
                    {text}
                  </p>
                )}

                {(hasPrimary || hasSecondary) && (
                  <div className="flex flex-wrap justify-center gap-4">
                    {hasPrimary && (
                      <Link to={primaryCtaLink} className="btn-primary">
                        {primaryCta}
                      </Link>
                    )}
                    {hasSecondary && (
                      <Link to={secondaryCtaLink} className="btn-secondary">
                        {secondaryCta}
                      </Link>
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
