import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Markdown from 'markdown-to-jsx';
import { Check, X } from 'lucide-react';
import { useOptionalEditMode } from '../../context/EditModeContext';
import { useEditableSave } from '../../hooks/useEditableSave';
import { sanitizeMarkdown } from '../../lib/sanitize';

interface EditableMarkdownProps {
  value: string;
  onSave: (next: string) => Promise<void> | void;
  /** Text shown in the toolbar header of the editor popover. */
  label?: string;
  /** Override the render in display mode (otherwise the sanitized markdown renders). */
  render?: (safeValue: string) => JSX.Element;
}

/**
 * Markdown content with click-to-edit via a modal editor. Outside edit
 * mode renders normally (sanitized) via markdown-to-jsx; inside edit
 * mode, the block is clickable — click opens a side-by-side textarea +
 * live preview modal.
 */
const EditableMarkdown = ({ value, onSave, label, render }: EditableMarkdownProps) => {
  const { isEditing } = useOptionalEditMode();
  const { isSaving: saving, error, clearError, runSave } = useEditableSave({ label });
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(value);
      clearError();
      queueMicrotask(() => textareaRef.current?.focus());
    }
  }, [clearError, isOpen, value]);

  const close = useCallback(() => setIsOpen(false), []);

  const commit = useCallback(async () => {
    if (draft === value) {
      close();
      return;
    }
    const result = await runSave(async () => {
      await onSave(draft);
      return true;
    });
    if (result) close();
  }, [close, draft, onSave, runSave, value]);

  // Esc / Cmd+S keyboard shortcuts inside modal.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        void commit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close, commit]);

  const safeValue = sanitizeMarkdown(value || '');
  const displayRender = render ?? ((v: string) => <Markdown>{v}</Markdown>);

  if (!isEditing) {
    return displayRender(safeValue);
  }

  // In edit mode: wrap the rendered markdown in a click-capturing shell.
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        data-editable="true"
        aria-label={label ?? 'Edit markdown'}
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        title="Click to edit markdown"
      >
        {displayRender(safeValue)}
      </div>

      {isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) close();
              }}
            >
              <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-white/15 bg-slate-900 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                    <span className="text-sm font-semibold text-white">
                      {label ?? 'Edit markdown'}
                    </span>
                    {error ? (
                      <span className="ml-3 text-xs text-red-400">{error}</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={close}
                      className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-white/30 hover:text-white"
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

                {/* Editor + preview side-by-side */}
                <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
                  <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    spellCheck
                    className="min-h-[50vh] resize-none border-b border-white/10 bg-slate-950 p-5 font-mono text-sm text-slate-100 focus:outline-none md:border-b-0 md:border-r"
                    placeholder="Markdown source…"
                  />
                  <article className="prose prose-invert max-h-[70vh] overflow-auto bg-slate-900 p-5 text-slate-200">
                    <Markdown>{sanitizeMarkdown(draft)}</Markdown>
                  </article>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default EditableMarkdown;
