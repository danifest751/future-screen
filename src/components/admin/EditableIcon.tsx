import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { useOptionalEditMode } from '../../context/EditModeContext';
import { useEditableSave } from '../../hooks/useEditableSave';
import { HOME_ICON_KEYS, HomeIcon } from '../../data/homeIcons';
import type { HomeIconKey } from '../../content/pages/home';

interface EditableIconProps {
  iconKey: HomeIconKey;
  onSave: (next: HomeIconKey) => Promise<void> | void;
  label?: string;
  className?: string;
}

/**
 * Click-to-pick icon swap for home/equipment/event-type items. Outside
 * edit mode renders the icon plainly; inside edit mode the icon gets
 * an editable wrapper and clicking opens a grid-of-icons modal.
 */
const EditableIcon = ({ iconKey, onSave, label, className }: EditableIconProps) => {
  const { isEditing } = useOptionalEditMode();
  const { isSaving: saving, error, runSave } = useEditableSave({ label });
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  const handlePick = useCallback(
    async (next: HomeIconKey) => {
      if (next === iconKey) {
        close();
        return;
      }
      const result = await runSave(async () => {
        await onSave(next);
        return true;
      });
      if (result) close();
    },
    [close, iconKey, onSave, runSave],
  );

  const iconEl = <HomeIcon iconKey={iconKey} className={className} />;

  if (!isEditing) {
    return iconEl;
  }

  return (
    <>
      <button
        type="button"
        data-editable="true"
        data-editable-saving={saving ? 'true' : undefined}
        data-editable-error={error ? 'true' : undefined}
        aria-label={label ?? 'Edit icon'}
        title={label ?? 'Click to replace icon'}
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center"
      >
        {iconEl}
      </button>

      {isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) close();
              }}
            >
              <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-white/15 bg-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                    <span className="text-sm font-semibold text-white">
                      {label ?? 'Pick icon'}
                    </span>
                    {error ? (
                      <span className="ml-3 text-xs text-red-400">{error}</span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    disabled={saving}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-white/30 hover:text-white disabled:cursor-not-allowed"
                  >
                    <X className="h-3.5 w-3.5" />
                    Close
                  </button>
                </div>
                <div className="grid max-h-[60vh] grid-cols-4 gap-2 overflow-auto p-4 sm:grid-cols-6">
                  {HOME_ICON_KEYS.map((key) => {
                    const isActive = key === iconKey;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={saving}
                        onClick={() => void handlePick(key)}
                        className={`group flex flex-col items-center gap-2 rounded-xl border p-4 text-xs transition ${
                          isActive
                            ? 'border-amber-400 bg-amber-500/10 text-white'
                            : 'border-white/10 bg-slate-950/40 text-slate-400 hover:border-white/30 hover:text-white'
                        } disabled:opacity-60`}
                        title={key}
                      >
                        <HomeIcon iconKey={key} className="h-7 w-7" />
                        <span className="font-mono text-[10px] tracking-wide">{key}</span>
                        {isActive ? (
                          <Check className="absolute h-3 w-3 -translate-y-12 translate-x-10 text-amber-400" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default EditableIcon;
