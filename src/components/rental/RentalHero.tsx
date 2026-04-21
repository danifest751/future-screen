import { memo } from 'react';
import { Link } from 'react-router-dom';
import EditableList from '../admin/EditableList';
import { useOptionalEditMode } from '../../context/EditModeContext';
import { useEditableBinding } from '../../hooks/useEditableBinding';
import { BlurText } from '../effects/BlurText';

export interface RentalHeroPatch {
  title?: string;
  subtitle?: string;
  cta?: string;
  ctaLink?: string;
  secondaryCta?: string;
  secondaryCtaLink?: string;
  highlights?: string[];
}

interface RentalHeroProps {
  title: string;
  subtitle?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  highlights?: string[];
  showBlurTitle?: boolean;
  onPatch?: (patch: RentalHeroPatch) => Promise<void>;
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
  onPatch,
}: RentalHeroProps) {
  const { isEditing } = useOptionalEditMode();
  const disabled = !onPatch;

  const titleEdit = useEditableBinding({
    value: title,
    onSave: async (next) => onPatch?.({ title: next }),
    label: 'Hero — title',
    disabled,
  });
  const subtitleEdit = useEditableBinding({
    value: subtitle ?? '',
    onSave: async (next) => onPatch?.({ subtitle: next }),
    label: 'Hero — subtitle',
    disabled,
    kind: 'multiline',
  });
  const ctaEdit = useEditableBinding({
    value: primaryCtaText ?? '',
    onSave: async (next) => onPatch?.({ cta: next }),
    label: 'Hero — primary CTA',
    disabled,
  });
  const secondaryCtaEdit = useEditableBinding({
    value: secondaryCtaText ?? '',
    onSave: async (next) => onPatch?.({ secondaryCta: next }),
    label: 'Hero — secondary CTA',
    disabled,
  });

  const highlightsList = Array.isArray(highlights) ? highlights : [];
  const hasHighlights = highlightsList.length > 0 || isEditing;

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="container-page relative">
        <div className="max-w-4xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {isEditing ? (
              <span {...titleEdit.bindProps}>{titleEdit.value}</span>
            ) : showBlurTitle ? (
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

          {(subtitle || isEditing) && (
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl leading-relaxed">
              <span {...subtitleEdit.bindProps}>{subtitleEdit.value}</span>
            </p>
          )}

          {(primaryCtaText || secondaryCtaText || isEditing) && (
            <div className="flex flex-wrap gap-4 mb-10">
              {(primaryCtaText || isEditing) && (
                isEditing ? (
                  <span className="btn-primary">
                    <span {...ctaEdit.bindProps}>{ctaEdit.value || '— CTA —'}</span>
                  </span>
                ) : primaryCtaLink ? (
                  <Link to={primaryCtaLink} className="btn-primary">
                    {primaryCtaText}
                  </Link>
                ) : null
              )}
              {(secondaryCtaText || isEditing) && (
                isEditing ? (
                  <span className="btn-secondary">
                    <span {...secondaryCtaEdit.bindProps}>
                      {secondaryCtaEdit.value || '— secondary —'}
                    </span>
                  </span>
                ) : secondaryCtaLink ? (
                  <Link to={secondaryCtaLink} className="btn-secondary">
                    {secondaryCtaText}
                  </Link>
                ) : null
              )}
            </div>
          )}

          {hasHighlights && (
            <EditableList
              items={highlightsList}
              onSave={async (next) => onPatch?.({ highlights: next })}
              label="Hero — highlights"
              placeholder="One highlight per line"
            >
              <div className="flex flex-wrap gap-3">
                {highlightsList.map((highlight, index) => (
                  <span key={`${index}-${highlight.slice(0, 12)}`} className="badge">
                    {highlight}
                  </span>
                ))}
              </div>
            </EditableList>
          )}
        </div>
      </div>
    </section>
  );
});

export { RentalHero };
export default RentalHero;
