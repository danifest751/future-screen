import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { useOptionalEditMode } from '../../context/EditModeContext';

interface EditableListProps {
  items: string[];
  onSave: (next: string[]) => Promise<void> | void;
  /** Visible children rendered outside edit mode (the caller's normal list view). */
  children: JSX.Element | JSX.Element[] | null;
  label?: string;
  placeholder?: string;
}

/**
 * Click-to-edit list of simple strings (phones, emails, bullets). Outside
 * edit mode renders whatever children the caller passes (the normal list).
 * In edit mode wraps everything in a clickable shell; click opens a modal
 * with a textarea — one item per line — that saves as an array.
 */
const EditableList = ({ items, onSave, children, label, placeholder }: EditableListProps) => {
  const { isEditing, reportSaveStart, reportSaveEnd, reportSaveSucceeded } =
    useOptionalEditMode();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(items.join('\n'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(items.join('\n'));
      setError(null);
      queueMicrotask(() => textareaRef.current?.focus());
    }
  }, [isOpen, items]);

  const close = useCallback(() => setIsOpen(false), []);

  const commit = useCallback(async () => {
    const next = draft
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (next.join('|') === items.join('|')) {
      close();
      return;
    }
    setSaving(true);
    setError(null);
    reportSaveStart();
    try {
      await onSave(next);
      reportSaveSucceeded();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'save failed');
    } finally {
      setSaving(false);
      reportSaveEnd();
    }
  }, [close, draft, items, onSave, reportSaveEnd, reportSaveStart, reportSaveSucceeded]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        void commit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close, commit]);

  if (!isEditing) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        data-editable="true"
        aria-label={label ?? 'Edit list'}
        title={label ?? 'Click to edit list'}
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        {children}
      </div>

      {isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) close();
              }}
            >
              <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-white/15 bg-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                    <span className="text-sm font-semibold text-white">
                      {label ?? 'Edit list'}
                    </span>
                    <span className="text-xs text-slate-400">(one per line)</span>
                    {error ? <span className="ml-3 text-xs text-red-400">{error}</span> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={close}
                      disabled={saving}
                      className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-white/30 hover:text-white disabled:cursor-not-allowed"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void commit()}
                      disabled={saving}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-600"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  spellCheck
                  placeholder={placeholder ?? 'one item per line'}
                  className="min-h-[40vh] resize-none bg-slate-950 p-5 font-mono text-sm text-slate-100 focus:outline-none"
                />
                <div className="border-t border-white/10 bg-slate-900/50 px-5 py-2 text-xs text-slate-500">
                  Ctrl/Cmd + Enter to save · Esc to cancel · empty lines dropped
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default EditableList;
