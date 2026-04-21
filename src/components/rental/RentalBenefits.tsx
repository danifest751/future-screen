import { memo } from 'react';
import { Zap, Shield, Clock, HeadphonesIcon, Award, Settings } from 'lucide-react';
import { getRentalComponentContent } from '../../content/components/rental';
import { useI18n } from '../../context/I18nContext';
import { useEditableBinding } from '../../hooks/useEditableBinding';

export interface Benefit {
  title: string;
  description: string;
}

const getIcon = (title: string, locale: 'ru' | 'en') => {
  const lower = title.toLowerCase();
  const { benefitKeywordGroups } = getRentalComponentContent(locale);

  if (benefitKeywordGroups.speed.some((keyword) => lower.includes(keyword))) return Zap;
  if (benefitKeywordGroups.reliability.some((keyword) => lower.includes(keyword))) return Shield;
  if (benefitKeywordGroups.experience.some((keyword) => lower.includes(keyword))) return Award;
  if (benefitKeywordGroups.support.some((keyword) => lower.includes(keyword))) return HeadphonesIcon;
  if (benefitKeywordGroups.setup.some((keyword) => lower.includes(keyword))) return Settings;
  if (benefitKeywordGroups.timing.some((keyword) => lower.includes(keyword))) return Clock;

  return Zap;
};

interface BenefitCardProps {
  item: Benefit;
  index: number;
  locale: 'ru' | 'en';
  onSaveItem?: (next: Benefit) => Promise<void>;
}

const BenefitCard = ({ item, index, locale, onSaveItem }: BenefitCardProps) => {
  const disabled = !onSaveItem;
  const Icon = getIcon(item.title, locale);

  const titleEdit = useEditableBinding({
    value: item.title,
    onSave: async (next) => onSaveItem?.({ ...item, title: next }),
    label: `Benefit ${index + 1} — title`,
    disabled,
  });
  const descEdit = useEditableBinding({
    value: item.description,
    onSave: async (next) => onSaveItem?.({ ...item, description: next }),
    label: `Benefit ${index + 1} — description`,
    disabled,
    kind: 'multiline',
  });

  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:bg-white/[0.05] hover:border-brand-500/30">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/20 to-brand-600/10 text-brand-400">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        <span {...titleEdit.bindProps}>{titleEdit.value}</span>
      </h3>
      <p className="text-slate-400 text-sm leading-relaxed">
        <span {...descEdit.bindProps}>{descEdit.value}</span>
      </p>
    </div>
  );
};

interface RentalBenefitsProps {
  title?: string;
  items: Benefit[];
  onPatchTitle?: (title: string) => Promise<void>;
  onReplaceItems?: (next: Benefit[]) => Promise<void>;
}

const RentalBenefits = memo(function RentalBenefits({
  title,
  items,
  onPatchTitle,
  onReplaceItems,
}: RentalBenefitsProps) {
  const { siteLocale } = useI18n();
  const rentalComponentContent = getRentalComponentContent(siteLocale);
  const disabledTitle = !onPatchTitle;

  const titleEdit = useEditableBinding({
    value: title ?? rentalComponentContent.benefitsTitle,
    onSave: async (next) => onPatchTitle?.(next),
    label: 'Benefits — title',
    disabled: disabledTitle,
  });

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const handleSaveItem = onReplaceItems
    ? async (index: number, next: Benefit) => {
        const nextItems = [...items];
        nextItems[index] = next;
        await onReplaceItems(nextItems);
      }
    : undefined;

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
          <span {...titleEdit.bindProps}>{titleEdit.value}</span>
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <BenefitCard
              key={`${index}-${item.title.slice(0, 16)}`}
              item={item}
              index={index}
              locale={siteLocale}
              onSaveItem={handleSaveItem ? (next) => handleSaveItem(index, next) : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

export { RentalBenefits };
export default RentalBenefits;
