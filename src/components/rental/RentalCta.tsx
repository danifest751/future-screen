import { Link } from 'react-router-dom';
import { StarBorder } from '../effects/StarBorder';

interface RentalCtaProps {
  data: {
    title?: string;
    text?: string;
    primaryCta?: string;
    primaryCtaLink?: string;
    secondaryCta?: string;
    secondaryCtaLink?: string;
  };
}

export const RentalCta = ({ data }: RentalCtaProps) => {
  const { title, text, primaryCta, primaryCtaLink, secondaryCta, secondaryCtaLink } = data;

  if (!title && !text) {
    return null;
  }

  const hasPrimary = primaryCta && primaryCtaLink;
  const hasSecondary = secondaryCta && secondaryCtaLink;

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-transparent p-8 md:p-12">
          {/* Decorative elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand-600/10 blur-3xl" />
          
          <div className="relative max-w-2xl mx-auto text-center">
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
                  <StarBorder variant="button">
                    <Link
                      to={primaryCtaLink}
                      className="btn-primary"
                    >
                      {primaryCta}
                    </Link>
                  </StarBorder>
                )}
                {hasSecondary && (
                  <Link
                    to={secondaryCtaLink}
                    className="btn-secondary"
                  >
                    {secondaryCta}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
