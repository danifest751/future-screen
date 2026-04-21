import EditableList from '../admin/EditableList';
import { useOptionalEditMode } from '../../context/EditModeContext';
import { useEditableBinding } from '../../hooks/useEditableBinding';

export interface RentalAboutData {
  title?: string;
  text?: string;
  items?: string[];
}

interface RentalAboutProps {
  data: RentalAboutData;
  onPatch?: (patch: Partial<RentalAboutData>) => Promise<void>;
}

export const RentalAbout = ({ data, onPatch }: RentalAboutProps) => {
  const { isEditing } = useOptionalEditMode();
  const { title, text, items } = data;
  const itemsList = Array.isArray(items) ? items : [];
  const hasItems = itemsList.length > 0 || isEditing;
  const hasText = (text && text.trim().length > 0) || isEditing;
  const disabled = !onPatch;

  const titleEdit = useEditableBinding({
    value: title ?? '',
    onSave: async (next) => onPatch?.({ title: next }),
    label: 'About — title',
    disabled,
  });
  const textEdit = useEditableBinding({
    value: text ?? '',
    onSave: async (next) => onPatch?.({ text: next }),
    label: 'About — text',
    disabled,
    kind: 'multiline',
  });

  if (!title && !hasText && !hasItems && !isEditing) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            {(title || isEditing) && (
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                <span {...titleEdit.bindProps}>{titleEdit.value}</span>
              </h2>
            )}
            {hasText && (
              <div className="prose prose-invert prose-slate max-w-none">
                {isEditing ? (
                  <p className="text-slate-300 leading-relaxed">
                    <span {...textEdit.bindProps}>{textEdit.value}</span>
                  </p>
                ) : (
                  text &&
                  text.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-slate-300 leading-relaxed mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))
                )}
              </div>
            )}
          </div>

          {hasItems && (
            <div className="lg:pl-8">
              <EditableList
                items={itemsList}
                onSave={async (next) => onPatch?.({ items: next })}
                label="About — items"
                placeholder="One item per line"
              >
                <ul className="space-y-4">
                  {itemsList.map((item, index) => (
                    <li key={`${index}-${item.slice(0, 16)}`} className="flex items-start gap-3">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </EditableList>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
