import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useOptionalEditMode } from '../../context/EditModeContext';
import { getRentalComponentContent } from '../../content/components/rental';
import { useI18n } from '../../context/I18nContext';
import { useEditableBinding } from '../../hooks/useEditableBinding';

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqRowProps {
  item: FaqItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onSaveItem?: (next: FaqItem) => Promise<void>;
}

const FaqRow = ({ item, index, isOpen, onToggle, onSaveItem }: FaqRowProps) => {
  const { isEditing } = useOptionalEditMode();
  const disabled = !onSaveItem;

  const questionEdit = useEditableBinding({
    value: item.question,
    onSave: async (next) => onSaveItem?.({ ...item, question: next }),
    label: `FAQ ${index + 1} — question`,
    disabled,
  });
  const answerEdit = useEditableBinding({
    value: item.answer,
    onSave: async (next) => onSaveItem?.({ ...item, answer: next }),
    label: `FAQ ${index + 1} — answer`,
    disabled,
    kind: 'multiline',
  });

  const showAnswer = isOpen || isEditing;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        isOpen
          ? 'border-brand-500/30 bg-brand-500/[0.03]'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-white">
          <span {...questionEdit.bindProps}>{questionEdit.value}</span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${
          showAnswer ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="px-5 pb-5">
          <p className="text-slate-400 leading-relaxed">
            <span {...answerEdit.bindProps}>{answerEdit.value}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

interface RentalFaqProps {
  title?: string;
  items: FaqItem[];
  onPatchTitle?: (title: string) => Promise<void>;
  onReplaceItems?: (next: FaqItem[]) => Promise<void>;
}

export const RentalFaq = ({
  title,
  items,
  onPatchTitle,
  onReplaceItems,
}: RentalFaqProps) => {
  const { siteLocale } = useI18n();
  const rentalComponentContent = getRentalComponentContent(siteLocale);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const disabledTitle = !onPatchTitle;

  const titleEdit = useEditableBinding({
    value: title ?? rentalComponentContent.faqTitle,
    onSave: async (next) => onPatchTitle?.(next),
    label: 'FAQ — title',
    disabled: disabledTitle,
  });

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const handleSaveItem = onReplaceItems
    ? async (index: number, next: FaqItem) => {
        const nextItems = [...items];
        nextItems[index] = next;
        await onReplaceItems(nextItems);
      }
    : undefined;

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <HelpCircle className="h-7 w-7 text-brand-400" />
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              <span {...titleEdit.bindProps}>{titleEdit.value}</span>
            </h2>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <FaqRow
                key={`${index}-${item.question.slice(0, 16)}`}
                item={item}
                index={index}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                onSaveItem={handleSaveItem ? (next) => handleSaveItem(index, next) : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
