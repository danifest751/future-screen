import { useEffect, useRef, useState } from 'react';
import EditableImage from '../../components/admin/EditableImage';
import OptimizedImage from '../../components/OptimizedImage';
import { useOptionalEditMode } from '../../context/EditModeContext';
import { useEditableBinding } from '../../hooks/useEditableBinding';
import type { HomeWorksItem } from '../../lib/content/homeWorks';
import { shuffle } from './shuffle';

type HomeWorkItem = HomeWorksItem;

interface WorkSlideProps {
  item: HomeWorkItem;
  index: number;
  onSaveItem?: (next: HomeWorkItem) => Promise<void>;
}

const WorkSlide = ({ item, index, onSaveItem }: WorkSlideProps) => {
  const disabled = !onSaveItem;
  const tagEdit = useEditableBinding({
    value: item.tag,
    onSave: async (next) => onSaveItem?.({ ...item, tag: next }),
    label: `Work ${index + 1} — tag`,
    disabled,
  });
  const titleEdit = useEditableBinding({
    value: item.title,
    onSave: async (next) => onSaveItem?.({ ...item, title: next }),
    label: `Work ${index + 1} — title`,
    disabled,
  });

  const renderImage = (src: string) => (
    <OptimizedImage
      src={src}
      alt={item.title}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
  );

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '4/5' }}>
      {onSaveItem ? (
        <EditableImage
          src={item.src}
          alt={item.title}
          label={`Work ${index + 1} — photo`}
          onSave={async ({ url }) => {
            await onSaveItem({ ...item, src: url });
          }}
        >
          {renderImage}
        </EditableImage>
      ) : (
        renderImage(item.src)
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-5 transform translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
        <p className="text-brand-400 font-medium mb-1 uppercase tracking-wider text-xs">
          <span {...tagEdit.bindProps}>{tagEdit.value}</span>
        </p>
        <h3 className="text-lg font-bold text-white leading-tight">
          <span {...titleEdit.bindProps}>{titleEdit.value}</span>
        </h3>
      </div>
    </div>
  );
};

// Edit-mode grid: static 1:1 mapping so inline edits target items[i] directly.
const WorksEditGrid = ({
  items,
  onReplaceItems,
}: {
  items: readonly HomeWorkItem[];
  onReplaceItems: (next: HomeWorkItem[]) => Promise<void>;
}) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {items.map((item, i) => (
      <div key={`${i}-${item.src.slice(-16)}`} className="group relative overflow-hidden">
        <WorkSlide
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

function WorksSliderView({
  items,
  prevLabel,
  nextLabel,
}: {
  items: readonly HomeWorkItem[];
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

  return (
    <div
      className="relative rounded-2xl"
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
              <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '4/5' }}>
                <OptimizedImage
                  src={item.src}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5 transform translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
                  <p className="text-brand-400 font-medium mb-1 uppercase tracking-wider text-xs">{item.tag}</p>
                  <h3 className="text-lg font-bold text-white leading-tight">{item.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Left arrow */}
      <button
        onClick={() => go(-1)}
        aria-label={prevLabel}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-black/70 border border-white/20 text-white transition-all duration-200 hover:bg-brand-600 hover:border-brand-500 hover:scale-110"
        style={{ opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      {/* Right arrow */}
      <button
        onClick={() => go(1)}
        aria-label={nextLabel}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-black/70 border border-white/20 text-white transition-all duration-200 hover:bg-brand-600 hover:border-brand-500 hover:scale-110"
        style={{ opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    </div>
  );
}

// Works slider (dispatch: grid in edit mode, carousel otherwise).
export function WorksSlider({
  items,
  prevLabel,
  nextLabel,
  onReplaceItems,
}: {
  items: readonly HomeWorkItem[];
  prevLabel: string;
  nextLabel: string;
  onReplaceItems?: (next: HomeWorkItem[]) => Promise<void>;
}) {
  const { isEditing } = useOptionalEditMode();
  if (isEditing && onReplaceItems) {
    return <WorksEditGrid items={items} onReplaceItems={onReplaceItems} />;
  }
  return <WorksSliderView items={items} prevLabel={prevLabel} nextLabel={nextLabel} />;
}
