import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type FocusEvent } from 'react';
import toast from 'react-hot-toast';
import { useOptionalEditMode } from '../context/EditModeContext';
import { useOptionalI18n } from '../context/I18nContext';

export type EditableKind = 'text' | 'multiline';

export interface UseEditableBindingArgs {
  /** Current persisted value. When not editing, this is what renders. */
  value: string;
  /** Async save handler — called when the user commits a new value. */
  onSave: (next: string) => Promise<void> | void;
  /** Plain single-line text or block text (Shift+Enter for newlines). */
  kind?: EditableKind;
  /** Disable editability locally (e.g. when a parent isn't ready). */
  disabled?: boolean;
  /** Optional label shown in the tooltip/title on hover. */
  label?: string;
}

export interface EditableBindingResult {
  /** Value to render — either the draft being edited or the persisted value. */
  value: string;
  /**
   * Props to spread onto the element that should become editable.
   * Includes contentEditable toggling, handlers, and a class for styling.
   */
  bindProps: Record<string, unknown>;
  /** True while a save is in-flight. */
  isSaving: boolean;
  /** Last save error (if any); cleared on next successful save. */
  error: string | null;
}

/**
 * Click-to-edit binding. In edit mode:
 *   - click (or focus) puts the element into contentEditable
 *   - Enter commits (Shift+Enter inserts newline for kind='multiline')
 *   - Esc cancels
 *   - blur commits
 *
 * Outside edit mode the hook is inert: returns the persisted value and
 * an empty bindProps object, so regular users see no overhead.
 */
export function useEditableBinding({
  value,
  onSave,
  kind = 'text',
  disabled,
  label,
}: UseEditableBindingArgs): EditableBindingResult {
  const { isEditing, reportSaveSucceeded, reportSaveStart, reportSaveEnd } =
    useOptionalEditMode();
  const { siteLocale, adminLocale } = useOptionalI18n();
  const active = isEditing && !disabled;

  const ref = useRef<HTMLElement | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep contentEditable DOM in sync with the persisted value when not
  // actively editing (otherwise cursor position gets nuked on every rerender).
  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    if (ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  const commit = useCallback(
    async (next: string) => {
      const cleaned = kind === 'text' ? next.replace(/\s+/g, ' ').trim() : next;
      if (cleaned === value) {
        setDraft(null);
        return;
      }
      setIsSaving(true);
      setError(null);
      reportSaveStart();
      try {
        await onSave(cleaned);
        reportSaveSucceeded();
        // Confirm visually what was saved and into which language. Without
        // this it's easy for an admin to "save in EN mode" and not realise
        // they overwrote the EN copy of a Hero block, not the RU one.
        if (label) {
          const localeTag = siteLocale.toUpperCase();
          const text = adminLocale === 'ru'
            ? `«${label}» сохранено · ${localeTag}`
            : `"${label}" saved · ${localeTag}`;
          toast.success(text, { id: `editable:${label}`, duration: 2200 });
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'save failed';
        setError(message);
        if (label) {
          const text = adminLocale === 'ru'
            ? `«${label}» не сохранилось: ${message}`
            : `"${label}" save failed: ${message}`;
          toast.error(text, { id: `editable:${label}:err` });
        }
        // Revert DOM to persisted value so the user sees the rejection.
        if (ref.current) ref.current.textContent = value;
      } finally {
        setIsSaving(false);
        setDraft(null);
        reportSaveEnd();
      }
    },
    [adminLocale, kind, label, onSave, reportSaveSucceeded, reportSaveStart, reportSaveEnd, siteLocale, value],
  );

  const cancel = useCallback(() => {
    if (ref.current) ref.current.textContent = value;
    setDraft(null);
    setError(null);
    ref.current?.blur();
  }, [value]);

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLElement>) => {
      if (!active) return;
      const next = e.currentTarget.textContent ?? '';
      void commit(next);
    },
    [active, commit],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (!active) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
        return;
      }
      if (e.key === 'Enter' && (kind === 'text' || !e.shiftKey)) {
        e.preventDefault();
        (e.currentTarget as HTMLElement).blur();
      }
    },
    [active, cancel, kind],
  );

  const handleInput = useCallback((e: { currentTarget: { textContent: string | null } }) => {
    setDraft(e.currentTarget.textContent ?? '');
  }, []);

  // Styled via CSS attribute selectors ([data-editable]) so the caller
  // keeps its own className untouched.
  const bindProps: Record<string, unknown> = active
    ? {
        ref: (el: HTMLElement | null) => {
          ref.current = el;
        },
        contentEditable: true,
        suppressContentEditableWarning: true,
        spellCheck: true,
        role: 'textbox',
        'aria-label': label ?? 'Editable content',
        'data-editable': 'true',
        'data-editable-saving': isSaving ? 'true' : undefined,
        'data-editable-error': error ? 'true' : undefined,
        onBlur: handleBlur,
        onKeyDown: handleKeyDown,
        onInput: handleInput,
        title: label ?? 'Click to edit',
      }
    : {};

  return {
    value: active && draft !== null ? draft : value,
    bindProps,
    isSaving,
    error,
  };
}
