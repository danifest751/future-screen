import { memo } from 'react';
import { Link } from 'react-router-dom';
import { BlurText } from '../effects/BlurText';

interface RentalHeroProps {
  title: string;
  subtitle?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  highlights?: string[];
  showBlurTitle?: boolean;
}

const RentalHero = memo(function RentalHero({
  title,
  subtitle,
  primaryCtaText,
  primaryCtaLink,
  secondaryCtaText,
  secondaryCtaLink,
  highlights,
  showBlurTitle = false,
}: RentalHeroProps) {
  const hasHighlights = Array.isArray(highlights) && highlights.length > 0;

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="container-page relative">
        <div className="max-w-4xl">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {showBlurTitle ? (
              <BlurText 
                text={title} 
                className="inline-block" 
                animateBy="words" 
                direction="top" 
                delay={150} 
                stepDuration={0.5}
              />
            ) : (
              title
            )}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* CTA Buttons */}
          {(primaryCtaText || secondaryCtaText) && (
            <div className="flex flex-wrap gap-4 mb-10">
              {primaryCtaText && primaryCtaLink && (
                <Link
                  to={primaryCtaLink}
                  className="btn-primary"
                >
                  {primaryCtaText}
                </Link>
              )}
              {secondaryCtaText && secondaryCtaLink && (
                <Link
                  to={secondaryCtaLink}
                  className="btn-secondary"
                >
                  {secondaryCtaText}
                </Link>
              )}
            </div>
          )}

          {/* Highlights */}
          {hasHighlights && (
            <div className="flex flex-wrap gap-3">
              {highlights.map((highlight, index) => (
                <span
                  key={index}
                  className="badge"
                >
                  {highlight}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

export { RentalHero };
export default RentalHero;
