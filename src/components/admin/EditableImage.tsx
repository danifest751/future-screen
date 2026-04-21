import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { MediaLibrary } from './media/MediaLibrary';
import { useOptionalEditMode } from '../../context/EditModeContext';
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
}: EditableImageProps) => {
  const { isEditing, reportSaveStart, reportSaveEnd, reportSaveSucceeded } =
    useOptionalEditMode();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closePicker = useCallback(() => setIsPickerOpen(false), []);

  const handleSelect = useCallback(
    async (media: MediaItem) => {
      if (!media.public_url) {
        setError('Selected media has no URL');
        return;
      }
      setSaving(true);
      setError(null);
      reportSaveStart();
      try {
        await onSave({ url: media.public_url, mediaId: media.id ?? null });
        reportSaveSucceeded();
        closePicker();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'save failed');
      } finally {
        setSaving(false);
        reportSaveEnd();
      }
    },
    [closePicker, onSave, reportSaveEnd, reportSaveStart, reportSaveSucceeded],
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
        style={{ display: 'inline-block', cursor: 'pointer' }}
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
