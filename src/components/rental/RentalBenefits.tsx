import { memo } from 'react';
import { Zap, Shield, Clock, HeadphonesIcon, Award, Settings } from 'lucide-react';
import { rentalComponentContent } from '../../content/components/rental';

interface Benefit {
  title: string;
  description: string;
}

interface RentalBenefitsProps {
  title?: string;
  items: Benefit[];
}

const getIcon = (title: string) => {
  const lower = title.toLowerCase();
  const { benefitKeywordGroups } = rentalComponentContent;

  if (benefitKeywordGroups.speed.some((keyword) => lower.includes(keyword))) return Zap;
  if (benefitKeywordGroups.reliability.some((keyword) => lower.includes(keyword))) return Shield;
  if (benefitKeywordGroups.experience.some((keyword) => lower.includes(keyword))) return Award;
  if (benefitKeywordGroups.support.some((keyword) => lower.includes(keyword))) return HeadphonesIcon;
  if (benefitKeywordGroups.setup.some((keyword) => lower.includes(keyword))) return Settings;
  if (benefitKeywordGroups.timing.some((keyword) => lower.includes(keyword))) return Clock;

  return Zap;
};

const RentalBenefits = memo(function RentalBenefits({
  title = rentalComponentContent.benefitsTitle,
  items,
}: RentalBenefitsProps) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
          {title}
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const Icon = getIcon(item.title);
            return (
              <div
                key={index}
                className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:bg-white/[0.05] hover:border-brand-500/30"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/20 to-brand-600/10 text-brand-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export { RentalBenefits };
export default RentalBenefits;
