import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

interface Entry {
  keys: string[];
  label: string;
}

const SHORTCUTS: Array<{ group: string; entries: Entry[] }> = [
  {
    group: 'Общие',
    entries: [
      { keys: ['?'], label: 'Показать эту справку' },
      { keys: ['Ctrl', 'Z'], label: 'Отменить последнее действие' },
      { keys: ['Ctrl', 'Shift', 'Z'], label: 'Повторить' },
      { keys: ['Delete'], label: 'Удалить выбранный экран' },
    ],
  },
  {
    group: 'Canvas',
    entries: [
      { keys: ['Колесо мыши'], label: 'Зум в курсор' },
      { keys: ['ПКМ + drag'], label: 'Pan' },
      { keys: ['Space + ЛКМ'], label: 'Pan (альтернатива)' },
      { keys: ['ЛКМ'], label: 'Выбрать / двигать экран' },
    ],
  },
  {
    group: 'Инструменты',
    entries: [
      { keys: ['Scale'], label: '2 клика по известной длине' },
      { keys: ['Place'], label: '4 клика по углам экрана' },
      { keys: ['Drag угла'], label: 'Точная подстройка геометрии' },
    ],
  },
];

const ShortcutsModal = ({ open, onClose }: ShortcutsModalProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Горячие клавиши"
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-5">
          <h3 className="text-base font-semibold text-white">Горячие клавиши</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 rounded-md border border-white/10 bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:border-white/30 hover:text-white"
            aria-label="Закрыть"
          >
            <X className="h-3 w-3" />
            ESC
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto p-5">
          {SHORTCUTS.map((group) => (
            <section key={group.group}>
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.group}
              </h4>
              <ul className="space-y-1.5 text-xs">
                {group.entries.map((entry, i) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <span className="text-slate-300">{entry.label}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {entry.keys.map((k) => (
                        <kbd
                          key={k}
                          className="rounded-md border border-white/10 bg-slate-950 px-1.5 py-0.5 font-mono text-[10px] text-slate-200 shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ShortcutsModal;
