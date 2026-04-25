import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { MediaLibrary } from './media/MediaLibrary';
import { useOptionalEditMode } from '../../context/EditModeContext';
import { useEditableSave } from '../../hooks/useEditableSave';
import type { MediaItem } from '../../types/media';

interface EditableImageProps {
  src: string;
  alt: string;
  onSave: (next: { url: string; mediaId: string | null }) => Promise<void> | void;
  label?: string;
  className?: string;
  style?: CSSProperties;
  /** Optional renderer — lets callers keep custom LazyImage / srcset logic. */
  children?: (finalSrc: string) => JSX.Element;
  /**
   * Optional alt-text editor. When provided, the picker modal gets an
   * extra text field that saves the alt independently (most callers
   * derive alt from a sibling title and don't need this; only pass it
   * when the data model has a dedicated `alt` field, e.g. gallery items).
   */
  altEditor?: {
    value: string;
    onSave: (next: string) => Promise<void> | void;
  };
}

/**
 * Click-to-pick image swap. In edit mode the image gets an editable
 * outline; click opens a modal with the existing MediaLibrary picker.
 * Outside edit mode renders the passed image (or custom renderer) with
 * zero overhead.
 */
const EditableImage = ({
  src,
  alt,
  onSave,
  label,
  className,
  style,
  children,
  altEditor,
}: EditableImageProps) => {
  const { isEditing } = useOptionalEditMode();
  const imageSave = useEditableSave({ label });
  const altSave = useEditableSave({ label, suffix: ' (alt)' });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [altDraft, setAltDraft] = useState<string>(altEditor?.value ?? '');

  const saving = imageSave.isSaving;
  const altSaving = altSave.isSaving;
  const error = imageSave.error ?? altSave.error;

  // Reset the draft whenever the modal opens or the persisted alt changes.
  useEffect(() => {
    if (isPickerOpen) setAltDraft(altEditor?.value ?? '');
  }, [altEditor?.value, isPickerOpen]);

  const handleAltSave = useCallback(async () => {
    if (!altEditor) return;
    if (altDraft === altEditor.value) return;
    await altSave.runSave(async () => altEditor.onSave(altDraft));
  }, [altDraft, altEditor, altSave]);

  const closePicker = useCallback(() => setIsPickerOpen(false), []);

  const handleSelect = useCallback(
    async (media: MediaItem) => {
      if (!media.public_url) {
        // Synthesise an error via the save hook so it shows in the toolbar.
        await imageSave.runSave(async () => {
          throw new Error('Selected media has no URL');
        });
        return;
      }
      const result = await imageSave.runSave(async () => {
        await onSave({ url: media.public_url, mediaId: media.id ?? null });
        return true;
      });
      if (result) closePicker();
    },
    [closePicker, imageSave, onSave],
  );

  // Esc closes the picker.
  useEffect(() => {
    if (!isPickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePicker();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPickerOpen, closePicker]);

  const baseImage = children ? children(src) : (
    <img src={src} alt={alt} className={className} style={style} />
  );

  if (!isEditing) {
    return baseImage;
  }

  return (
    <>
      {/*
        Fill the nearest positioned ancestor — all current callers render the
        image as a cover layer (absolute/h-full inside a `.relative` card), so
        an inline-block wrapper would collapse and the image would vanish.
      */}
      <div
        role="button"
        tabIndex={0}
        data-editable="true"
        data-editable-saving={saving ? 'true' : undefined}
        data-editable-error={error ? 'true' : undefined}
        aria-label={label ?? 'Edit image'}
        title={label ?? 'Click to replace image'}
        onClick={() => setIsPickerOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsPickerOpen(true);
          }
        }}
        style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
      >
        {baseImage}
      </div>

      {isPickerOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) closePicker();
              }}
            >
              <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                    <span className="text-sm font-semibold text-white">
                      {label ?? 'Replace image'}
                    </span>
                    {error ? <span className="ml-3 text-xs text-red-400">{error}</span> : null}
                  </div>
                  <button
                    type="button"
                    onClick={closePicker}
                    disabled={saving}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-white/30 hover:text-white disabled:cursor-not-allowed"
                  >
                    <X className="h-3.5 w-3.5" />
                    Close
                  </button>
                </div>
                {altEditor ? (
                  <div className="border-b border-white/10 px-5 py-3">
                    <label className="flex flex-col gap-1 text-xs text-slate-300">
                      <span className="font-medium text-slate-200">
                        Alt text <span className="text-slate-500">(accessibility)</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={altDraft}
                          onChange={(e) => setAltDraft(e.target.value)}
                          placeholder="Describe the image for screen readers"
                          className="flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => void handleAltSave()}
                          disabled={altSaving || altDraft === altEditor.value}
                          className="rounded-lg bg-emerald-500/90 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-600"
                        >
                          {altSaving ? 'Saving…' : 'Save alt'}
                        </button>
                      </div>
                    </label>
                  </div>
                ) : null}
                <div className="flex-1 overflow-auto p-4">
                  <MediaLibrary
                    selectable
                    showUploadButton
                    onSelect={(media) => {
                      void handleSelect(media);
                    }}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default EditableImage;
