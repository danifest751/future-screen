import { Link } from 'react-router-dom';
import EditableImage from '../../components/admin/EditableImage';
import EditableList from '../../components/admin/EditableList';
import EditableIcon from '../../components/admin/EditableIcon';
import OptimizedImage from '../../components/OptimizedImage';
import { HomeIcon } from '../../data/homeIcons';
import { useOptionalEditMode } from '../../context/EditModeContext';
import { useEditableBinding } from '../../hooks/useEditableBinding';
import type { HomeIconKey } from '../../content/pages/home';
import type { HomeEquipmentSectionContent } from '../../lib/content/homeEquipmentSection';

type HomeEquipmentItem = HomeEquipmentSectionContent['items'][number];
type HomeEquipmentExtraItem = HomeEquipmentSectionContent['extraItems'][number];

interface EquipmentCardProps {
  item: HomeEquipmentItem;
  index: number;
  onSaveItem?: (next: HomeEquipmentItem) => Promise<void>;
}

export const EquipmentCard = ({ item, index, onSaveItem }: EquipmentCardProps) => {
  const { isEditing } = useOptionalEditMode();
  const disabled = !onSaveItem;

  const titleEdit = useEditableBinding({
    value: item.title,
    onSave: async (next) => onSaveItem?.({ ...item, title: next }),
    label: `Equipment ${index + 1} — title`,
    disabled,
  });
  const descEdit = useEditableBinding({
    value: item.desc,
    onSave: async (next) => onSaveItem?.({ ...item, desc: next }),
    label: `Equipment ${index + 1} — description`,
    disabled,
    kind: 'multiline',
  });

  const renderImage = (src: string) => (
    <OptimizedImage
      src={src}
      alt={item.title}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
  );

  const inner = (
    <>
      {onSaveItem ? (
        <EditableImage
          src={item.photo}
          alt={item.title}
          label={`Equipment ${index + 1} — photo`}
          onSave={async ({ url }) => {
            await onSaveItem({ ...item, photo: url });
          }}
        >
          {renderImage}
        </EditableImage>
      ) : (
        renderImage(item.photo)
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6">
        <div
          className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ background: item.gradient }}
        >
          {onSaveItem ? (
            <EditableIcon
              iconKey={item.iconKey as HomeIconKey}
              onSave={async (next) => onSaveItem({ ...item, iconKey: next })}
              label={`Equipment ${index + 1} — icon`}
              className="h-6 w-6"
            />
          ) : (
            <HomeIcon iconKey={item.iconKey as HomeIconKey} className="h-6 w-6" />
          )}
        </div>
        <h3 className="font-display mb-1 text-lg font-semibold text-white group-hover:text-brand-300 transition-colors">
          <span {...titleEdit.bindProps}>{titleEdit.value}</span>
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-gray-300 mb-3">
          <span {...descEdit.bindProps}>{descEdit.value}</span>
        </p>
        <EditableList
          items={[...item.bullets]}
          onSave={async (next) => {
            if (!onSaveItem || next.length === 0) return;
            await onSaveItem({ ...item, bullets: next });
          }}
          label={`Equipment ${index + 1} — bullets`}
          placeholder="One bullet per line"
        >
          <ul className="space-y-1">
            {item.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2 text-xs text-gray-300">
                <span
                  className="h-1 w-1 shrink-0 rounded-full"
                  style={{ background: item.gradient }}
                />
                {b}
              </li>
            ))}
          </ul>
        </EditableList>
      </div>
    </>
  );

  if (isEditing) {
    return (
      <div className="group relative overflow-hidden rounded-2xl min-h-[300px] block">
        {inner}
      </div>
    );
  }
  return (
    <Link
      to={item.link}
      className="group relative overflow-hidden rounded-2xl min-h-[300px] block cursor-pointer"
    >
      {inner}
    </Link>
  );
};

interface EquipmentExtraCardProps {
  item: HomeEquipmentExtraItem;
  index: number;
  onSaveItem?: (next: HomeEquipmentExtraItem) => Promise<void>;
}

export const EquipmentExtraCard = ({ item, index, onSaveItem }: EquipmentExtraCardProps) => {
  const { isEditing } = useOptionalEditMode();
  const disabled = !onSaveItem;

  const titleEdit = useEditableBinding({
    value: item.title,
    onSave: async (next) => onSaveItem?.({ ...item, title: next }),
    label: `Extra equipment ${index + 1} — title`,
    disabled,
  });
  const descEdit = useEditableBinding({
    value: item.desc,
    onSave: async (next) => onSaveItem?.({ ...item, desc: next }),
    label: `Extra equipment ${index + 1} — description`,
    disabled,
  });

  const renderImage = (src: string) => (
    <OptimizedImage
      src={src}
      alt={item.title}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
  );

  const inner = (
    <>
      {onSaveItem ? (
        <EditableImage
          src={item.photo}
          alt={item.title}
          label={`Extra equipment ${index + 1} — photo`}
          onSave={async ({ url }) => {
            await onSaveItem({ ...item, photo: url });
          }}
        >
          {renderImage}
        </EditableImage>
      ) : (
        renderImage(item.photo)
      )}
      <div className="absolute inset-0 bg-black/65 group-hover:bg-black/55 transition-colors pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-3 p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white group-hover:bg-brand-500/30 transition-colors">
          {onSaveItem ? (
            <EditableIcon
              iconKey={item.iconKey as HomeIconKey}
              onSave={async (next) => onSaveItem({ ...item, iconKey: next })}
              label={`Extra equipment ${index + 1} — icon`}
              className="h-5 w-5"
            />
          ) : (
            <HomeIcon iconKey={item.iconKey as HomeIconKey} className="h-5 w-5" />
          )}
        </div>
        <div>
          <div className="font-medium text-white group-hover:text-brand-300 transition-colors leading-tight">
            <span {...titleEdit.bindProps}>{titleEdit.value}</span>
          </div>
          <div className="text-xs text-gray-400 line-clamp-1">
            <span {...descEdit.bindProps}>{descEdit.value}</span>
          </div>
        </div>
      </div>
    </>
  );

  if (isEditing) {
    return (
      <div className="group relative overflow-hidden rounded-2xl min-h-[120px] block">
        {inner}
      </div>
    );
  }
  return (
    <Link
      to={item.link}
      className="group relative overflow-hidden rounded-2xl min-h-[120px] block cursor-pointer"
    >
      {inner}
    </Link>
  );
};
