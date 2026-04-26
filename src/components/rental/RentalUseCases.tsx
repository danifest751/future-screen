import { memo } from 'react';
import { getRentalComponentContent } from '../../content/components/rental';
import { useI18n } from '../../context/I18nContext';
import { useEditableBinding } from '../../hooks/useEditableBinding';
import OptimizedImage from '../OptimizedImage';

export interface UseCase {
  title: string;
  description: string;
}

interface UseCaseCardProps {
  item: UseCase;
  index: number;
  slug?: string;
  onSaveItem?: (next: UseCase) => Promise<void>;
}

const UseCaseCard = ({ item, index, slug, onSaveItem }: UseCaseCardProps) => {
  const disabled = !onSaveItem;

  const titleEdit = useEditableBinding({
    value: item.title,
    onSave: async (next) => onSaveItem?.({ ...item, title: next }),
    label: `Use case ${index + 1} — title`,
    disabled,
  });
  const descEdit = useEditableBinding({
    value: item.description,
    onSave: async (next) => onSaveItem?.({ ...item, description: next }),
    label: `Use case ${index + 1} — description`,
    disabled,
    kind: 'multiline',
  });

  const imgSrc = slug ? `/images/usecases/${slug}-${index + 1}.png` : null;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
      {imgSrc && (
        <div className="relative h-44 w-full overflow-hidden">
          <OptimizedImage
            src={imgSrc}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
        </div>
      )}

      <div className="p-5">
        <h3 className="text-base font-semibold text-white mb-2">
          <span {...titleEdit.bindProps}>{titleEdit.value}</span>
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          <span {...descEdit.bindProps}>{descEdit.value}</span>
        </p>
      </div>
    </div>
  );
};

interface RentalUseCasesProps {
  title?: string;
  items: UseCase[];
  slug?: string;
  onReplace?: (next: UseCase[]) => Promise<void>;
}

const RentalUseCases = memo(function RentalUseCases({
  title,
  items,
  slug,
  onReplace,
}: RentalUseCasesProps) {
  const { siteLocale } = useI18n();
  const rentalComponentContent = getRentalComponentContent(siteLocale);

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const handleSaveItem = onReplace
    ? async (index: number, next: UseCase) => {
        const nextItems = [...items];
        nextItems[index] = next;
        await onReplace(nextItems);
      }
    : undefined;

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
          {title ?? rentalComponentContent.useCasesTitle}
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <UseCaseCard
              key={`${index}-${item.title.slice(0, 16)}`}
              item={item}
              index={index}
              slug={slug}
              onSaveItem={handleSaveItem ? (next) => handleSaveItem(index, next) : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

export { RentalUseCases };
export default RentalUseCases;
