import { useEffect, useRef, useState } from 'react';
import EditableImage from '../../components/admin/EditableImage';
import EditableIcon from '../../components/admin/EditableIcon';
import OptimizedImage from '../../components/OptimizedImage';
import { HomeIcon } from '../../data/homeIcons';
import { useOptionalEditMode } from '../../context/EditModeContext';
import { useEditableBinding } from '../../hooks/useEditableBinding';
import type { HomeIconKey } from '../../content/pages/home';
import { shuffle } from './shuffle';

export type EventItem = {
  iconKey: HomeIconKey;
  title: string;
  desc: string;
  photo: string;
};

interface EventSlideProps {
  item: EventItem;
  index: number;
  onSaveItem?: (next: EventItem) => Promise<void>;
}

const EventSlide = ({ item, index, onSaveItem }: EventSlideProps) => {
  const { isEditing } = useOptionalEditMode();
  const disabled = !onSaveItem;
  const titleEdit = useEditableBinding({
    value: item.title,
    onSave: async (next) => onSaveItem?.({ ...item, title: next }),
    label: `Event type ${index + 1} — title`,
    disabled,
  });
  const descEdit = useEditableBinding({
    value: item.desc,
    onSave: async (next) => onSaveItem?.({ ...item, desc: next }),
    label: `Event type ${index + 1} — description`,
    disabled,
    kind: 'multiline',
  });

  const renderImage = (src: string) => (
    <OptimizedImage
      src={src}
      alt={item.title}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      style={{ filter: 'saturate(0.5) brightness(0.6)' }}
    />
  );

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '4/3' }}>
      {onSaveItem ? (
        <EditableImage
          src={item.photo}
          alt={item.title}
          label={`Event type ${index + 1} — photo`}
          onSave={async ({ url }) => {
            await onSaveItem({ ...item, photo: url });
          }}
        >
          {renderImage}
        </EditableImage>
      ) : (
        renderImage(item.photo)
      )}
      <div className="absolute inset-0 bg-black/50 transition-colors duration-300 group-hover:bg-black/25 pointer-events-none" />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white pointer-events-none">
        <div className="mb-3 opacity-80 group-hover:opacity-100 transition-opacity pointer-events-auto">
          {onSaveItem ? (
            <EditableIcon
              iconKey={item.iconKey}
              onSave={async (next) => onSaveItem({ ...item, iconKey: next })}
              label={`Event type ${index + 1} — icon`}
              className="h-8 w-8"
            />
          ) : (
            <HomeIcon iconKey={item.iconKey} className="h-8 w-8" />
          )}
        </div>
        <h3 className="font-display text-xl font-bold pointer-events-auto">
          <span {...titleEdit.bindProps}>{titleEdit.value}</span>
        </h3>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center pointer-events-none">
        <p
          className={`text-xs leading-relaxed text-gray-200 transition-opacity duration-300 pointer-events-auto ${
            isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-90'
          }`}
        >
          <span {...descEdit.bindProps}>{descEdit.value}</span>
        </p>
      </div>
    </div>
  );
};

const EventsEditGrid = ({
  items,
  onReplaceItems,
}: {
  items: readonly EventItem[];
  onReplaceItems: (next: EventItem[]) => Promise<void>;
}) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {items.map((item, i) => (
      <div key={`${i}-${item.photo.slice(-16)}`} className="group relative overflow-hidden">
        <EventSlide
          item={item}
          index={i}
          onSaveItem={async (next) => {
            const nextItems = [...items];
            nextItems[i] = next;
            await onReplaceItems(nextItems);
          }}
        />
      </div>
    ))}
  </div>
);

function EventsSliderView({
  items,
  prevLabel,
  nextLabel,
}: {
  items: readonly EventItem[];
  prevLabel: string;
  nextLabel: string;
}) {
  const [shuffled] = useState(() => shuffle(items));
  const n = shuffled.length;
  const all = [...shuffled, ...shuffled, ...shuffled];
  const [visible, setVisible] = useState(3);
  const [idx, setIdxState] = useState(n);
  const idxRef = useRef(n);
  const [animated, setAnimated] = useState(true);
  const [hovered, setHovered] = useState(false);

  const setIdx = (val: number) => { idxRef.current = val; setIdxState(val); };

  useEffect(() => {
    const update = () =>
      setVisible(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const go = (dir: 1 | -1) => { const next = idxRef.current + dir; setIdx(next); };

  const handleTransitionEnd = () => {
    const cur = idxRef.current;
    if (cur >= n * 2) {
      setAnimated(false);
      setIdx(cur - n);
      setTimeout(() => setAnimated(true), 20);
    } else if (cur < n) {
      setAnimated(false);
      setIdx(cur + n);
      setTimeout(() => setAnimated(true), 20);
    }
  };

  const translatePct = -(idx / all.length) * 100;

  const arrowBtn = 'absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-black/70 border border-white/20 text-white transition-all duration-200 hover:bg-brand-600 hover:border-brand-500 hover:scale-110';

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex"
          style={{
            width: `${(all.length / visible) * 100}%`,
            transform: `translateX(${translatePct}%)`,
            transition: animated ? 'transform 0.45s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {all.map((item, i) => (
            <div
              key={i}
              className="group relative overflow-hidden cursor-pointer px-2"
              style={{ width: `${100 / all.length}%` }}
            >
              <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '4/3' }}>
                <OptimizedImage
                  src={item.photo}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ filter: 'saturate(0.5) brightness(0.6)' }}
                />
                <div className="absolute inset-0 bg-black/50 transition-colors duration-300 group-hover:bg-black/25" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                  <div className="mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
                    <HomeIcon iconKey={item.iconKey} className="h-8 w-8" />
                  </div>
                  <h3 className="font-display text-xl font-bold">{item.title}</h3>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                  <p className="text-xs leading-relaxed text-gray-200 opacity-0 transition-opacity duration-300 group-hover:opacity-90">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => go(-1)}
        aria-label={prevLabel}
        className={`${arrowBtn} left-3`}
        style={{ opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      <button
        onClick={() => go(1)}
        aria-label={nextLabel}
        className={`${arrowBtn} right-3`}
        style={{ opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    </div>
  );
}

export function EventsSlider({
  items,
  prevLabel,
  nextLabel,
  onReplaceItems,
}: {
  items: readonly EventItem[];
  prevLabel: string;
  nextLabel: string;
  onReplaceItems?: (next: EventItem[]) => Promise<void>;
}) {
  const { isEditing } = useOptionalEditMode();
  if (isEditing && onReplaceItems) {
    return <EventsEditGrid items={items} onReplaceItems={onReplaceItems} />;
  }
  return <EventsSliderView items={items} prevLabel={prevLabel} nextLabel={nextLabel} />;
}
