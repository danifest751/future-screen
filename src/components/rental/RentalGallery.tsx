import { memo } from 'react';
import EditableImage from '../admin/EditableImage';
import { useOptionalEditMode } from '../../context/EditModeContext';
import { getRentalComponentContent } from '../../content/components/rental';
import { useI18n } from '../../context/I18nContext';
import { useEditableBinding } from '../../hooks/useEditableBinding';
import OptimizedImage from '../OptimizedImage';

export interface GalleryItem {
  image: string;
  alt: string;
  caption?: string;
}

interface GalleryCardProps {
  item: GalleryItem;
  index: number;
  emptyLabel: string;
  onSaveItem?: (next: GalleryItem) => Promise<void>;
}

const GalleryCard = ({ item, index, emptyLabel, onSaveItem }: GalleryCardProps) => {
  const { isEditing } = useOptionalEditMode();
  const disabled = !onSaveItem;

  const captionEdit = useEditableBinding({
    value: item.caption ?? '',
    onSave: async (next) => onSaveItem?.({ ...item, caption: next }),
    label: `Gallery ${index + 1} — caption`,
    disabled,
  });
  const altEdit = useEditableBinding({
    value: item.alt ?? '',
    onSave: async (next) => onSaveItem?.({ ...item, alt: next }),
    label: `Gallery ${index + 1} — alt text`,
    disabled,
  });

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] aspect-[4/3]">
      {item.image ? (
        <EditableImage
          src={item.image}
          alt={item.alt || ''}
          label={`Gallery image ${index + 1}`}
          onSave={async ({ url }) => {
            if (onSaveItem) await onSaveItem({ ...item, image: url });
          }}
          altEditor={
            onSaveItem
              ? {
                  value: item.alt ?? '',
                  onSave: async (nextAlt) => {
                    await onSaveItem({ ...item, alt: nextAlt });
                  },
                }
              : undefined
          }
        >
          {(src) => (
            <OptimizedImage
              src={src}
              alt={item.alt || ''}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          )}
        </EditableImage>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-white/[0.05]">
          <span className="text-slate-500 text-sm">{emptyLabel}</span>
        </div>
      )}

      {(item.caption || isEditing) && (
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${
            isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <p className="text-sm text-white">
            <span {...captionEdit.bindProps}>{captionEdit.value || '— caption —'}</span>
          </p>
          {isEditing && (
            <p className="mt-1 text-xs text-slate-400">
              alt: <span {...altEdit.bindProps}>{altEdit.value || '—'}</span>
            </p>
          )}
        </div>
      )}

      <div className="absolute inset-0 bg-brand-500/10 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
    </div>
  );
};

interface RentalGalleryProps {
  items: GalleryItem[];
  title?: string;
  onPatchTitle?: (title: string) => Promise<void>;
  onReplaceItems?: (next: GalleryItem[]) => Promise<void>;
}

const RentalGallery = memo(function RentalGallery({
  items,
  title,
  onPatchTitle,
  onReplaceItems,
}: RentalGalleryProps) {
  const { siteLocale } = useI18n();
  const rentalComponentContent = getRentalComponentContent(siteLocale);
  const disabledTitle = !onPatchTitle;

  const titleEdit = useEditableBinding({
    value: title ?? rentalComponentContent.galleryTitle,
    onSave: async (next) => onPatchTitle?.(next),
    label: 'Gallery — title',
    disabled: disabledTitle,
  });

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const handleSaveItem = onReplaceItems
    ? async (index: number, next: GalleryItem) => {
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <GalleryCard
              key={`${index}-${item.image.slice(-16)}`}
              item={item}
              index={index}
              emptyLabel={rentalComponentContent.galleryEmptyLabel}
              onSaveItem={handleSaveItem ? (next) => handleSaveItem(index, next) : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

export { RentalGallery };
export default RentalGallery;
