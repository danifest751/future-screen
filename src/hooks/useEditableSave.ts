import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useOptionalEditMode } from '../context/EditModeContext';
import { useOptionalI18n } from '../context/I18nContext';

export interface UseEditableSaveOptions {
  /** Human-readable name of the field; drives toast text and id. */
  label?: string;
  /** Per-call suffix (e.g. " (alt)" for the alt-text editor inside EditableImage). */
  suffix?: string;
}

export interface UseEditableSaveResult {
  isSaving: boolean;
  error: string | null;
  clearError: () => void;
  /**
   * Wraps an async save with the inline-edit lifecycle:
   *   - reportSaveStart/End (so the beforeunload guard works);
   *   - reportSaveSucceeded on success (so other listeners refetch);
   *   - localized success/error toast tagged with `label · LOCALE` so the
   *     admin sees what was saved and into which language;
   *   - returns the resolved value on success, `null` on failure (so callers
   *     can branch without their own try/catch).
   */
  runSave: <T>(fn: () => Promise<T>) => Promise<T | null>;
}

/**
 * Single-source-of-truth for "I'm saving an inline edit" state. Used by
 * `useEditableBinding` and the modal-based editors (EditableImage,
 * EditableList, EditableIcon, EditableMarkdown) so they all show the
 * same toast on success/failure, register with the beforeunload guard,
 * and bump the global savesVersion.
 */
export function useEditableSave({ label, suffix }: UseEditableSaveOptions = {}): UseEditableSaveResult {
  const { reportSaveStart, reportSaveEnd, reportSaveSucceeded } = useOptionalEditMode();
  const { siteLocale, adminLocale } = useOptionalI18n();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const runSave = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      setIsSaving(true);
      setError(null);
      reportSaveStart();
      const fullLabel = label ? `${label}${suffix ?? ''}` : null;
      try {
        const result = await fn();
        reportSaveSucceeded();
        if (fullLabel) {
          const localeTag = siteLocale.toUpperCase();
          const text = adminLocale === 'ru'
            ? `«${fullLabel}» сохранено · ${localeTag}`
            : `"${fullLabel}" saved · ${localeTag}`;
          toast.success(text, { id: `editable:${fullLabel}`, duration: 2200 });
        }
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'save failed';
        setError(message);
        if (fullLabel) {
          const text = adminLocale === 'ru'
            ? `«${fullLabel}» не сохранилось: ${message}`
            : `"${fullLabel}" save failed: ${message}`;
          toast.error(text, { id: `editable:${fullLabel}:err` });
        }
        return null;
      } finally {
        setIsSaving(false);
        reportSaveEnd();
      }
    },
    [adminLocale, label, reportSaveEnd, reportSaveStart, reportSaveSucceeded, siteLocale, suffix],
  );

  return { isSaving, error, clearError, runSave };
}
