import { useEffect } from 'react';
import { X } from 'lucide-react';
import PresetPicker from './PresetPicker';

interface PresetSwitcherModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * In-editor preset switcher. Wraps PresetPicker in a modal so the user
 * can swap pressets without going back to the empty-canvas onboarding
 * gate. Selecting any preset (including "Свой вариант") closes the modal
 * — the existing scene's screens stay; only the active background and
 * preset slug change. Earlier preset backgrounds remain in the scene's
 * library so the user can switch back from the right sidebar.
 */
const PresetSwitcherModal = ({ open, onClose }: PresetSwitcherModalProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preset-switcher-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2
              id="preset-switcher-title"
              className="text-xl font-bold text-white sm:text-2xl"
            >
              Сменить пресет
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Текущие экраны останутся на сцене — поменяется только фон и
              ориентир цены.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <PresetPicker compact onAfterPick={onClose} />
      </div>
    </div>
  );
};

export default PresetSwitcherModal;
