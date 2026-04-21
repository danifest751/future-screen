import { memo } from 'react';
import { Check } from 'lucide-react';
import EditableList from '../admin/EditableList';
import { useOptionalEditMode } from '../../context/EditModeContext';
import { getRentalComponentContent } from '../../content/components/rental';
import { useI18n } from '../../context/I18nContext';
import { useEditableBinding } from '../../hooks/useEditableBinding';

interface RentalServiceIncludesProps {
  title?: string;
  items: string[];
  onPatch?: (patch: { title?: string; items?: string[] }) => Promise<void>;
}

const RentalServiceIncludes = memo(function RentalServiceIncludes({
  title,
  items,
  onPatch,
}: RentalServiceIncludesProps) {
  const { isEditing } = useOptionalEditMode();
  const { siteLocale } = useI18n();
  const rentalComponentContent = getRentalComponentContent(siteLocale);
  const disabled = !onPatch;

  const titleEdit = useEditableBinding({
    value: title ?? rentalComponentContent.serviceIncludesTitle,
    onSave: async (next) => onPatch?.({ title: next }),
    label: 'Service includes — title',
    disabled,
  });

  if ((!Array.isArray(items) || items.length === 0) && !isEditing) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-6 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
            <span {...titleEdit.bindProps}>{titleEdit.value}</span>
          </h2>

          <EditableList
            items={items ?? []}
            onSave={async (next) => onPatch?.({ items: next })}
            label="Service includes — items"
            placeholder="One item per line"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(items ?? []).map((item, index) => (
                <div
                  key={`${index}-${item.slice(0, 12)}`}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 transition hover:bg-white/[0.05] hover:border-white/10"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="text-slate-300 text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </EditableList>
        </div>
      </div>
    </section>
  );
});

export { RentalServiceIncludes };
export default RentalServiceIncludes;
