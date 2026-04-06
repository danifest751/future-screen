import { useState, useCallback, useRef } from 'react';
import { X, Upload, FileImage, FileVideo, Trash2, Check, AlertCircle } from 'lucide-react';
import { mediaUploadModalContent } from '../../../content/components/mediaUploadModal';
import { useI18n } from '../../../context/I18nContext';
import { useMediaUpload, getAcceptedFileTypes, isValidFileType, formatUploadStatus } from '../../../hooks/useMediaUpload';
import { formatFileSize } from '../../../lib/imageCompression';
import type { MediaItem } from '../../../types/media';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (items: MediaItem[]) => void;
  defaultTags?: string[];
}

const MediaUploadModalContent = ({
  onClose,
  onUploadComplete,
  defaultTags = [],
}: Omit<MediaUploadModalProps, 'isOpen'>) => {
  const [tags, setTags] = useState<string[]>(defaultTags);
  const [tagInput, setTagInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { adminLocale } = useI18n();

  const {
    uploads,
    isUploading,
    uploadFiles,
    clearUploads,
    removeUpload,
    completedCount,
    errorCount,
    totalCount,
  } = useMediaUpload();

  const handleClose = () => {
    if (!isUploading) {
      clearUploads();
      setTags(defaultTags);
      onClose();
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await uploadFiles(files, { tags });
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(isValidFileType);
    if (files.length > 0) {
      await uploadFiles(files, { tags });
    }
  }, [uploadFiles, tags]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const addTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addTag();
    }
  };

  const completedItems = uploads
    .filter((u) => u.status === 'completed' && u.result)
    .map((u) => u.result!);

  const handleComplete = () => {
    if (completedItems.length > 0) {
      onUploadComplete?.(completedItems);
    }
    clearUploads();
    setTags(defaultTags);
    onClose();
  };

  const originalSize = uploads.reduce((acc, u) => acc + u.file.size, 0);
  const hasCompleted = completedCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">{mediaUploadModalContent.header.title}</h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              {mediaUploadModalContent.tags.label}
            </label>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-slate-800 p-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded bg-brand-500/20 px-2 py-1 text-sm text-brand-200"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-white"
                    disabled={isUploading}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                onBlur={addTag}
                placeholder={tags.length === 0 ? mediaUploadModalContent.tags.placeholder : ''}
                disabled={isUploading}
                className="min-w-[120px] flex-1 bg-transparent px-2 py-1 text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {mediaUploadModalContent.tags.hint}
            </p>
          </div>

          {!hasCompleted && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors
                ${isDragging
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-white/20 bg-slate-800 hover:border-white/40'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={getAcceptedFileTypes()}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                disabled={isUploading}
              />
              <Upload className="mx-auto mb-3 text-slate-400" size={40} />
              <p className="text-sm text-slate-300">
                {mediaUploadModalContent.dropZone.prompt}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {mediaUploadModalContent.dropZone.formats}
              </p>
            </div>
          )}

          {totalCount > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-300">
                  {mediaUploadModalContent.list.selectedFiles(totalCount)}
                </h3>
                {!isUploading && (
                  <button
                    onClick={clearUploads}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    {mediaUploadModalContent.list.clear}
                  </button>
                )}
              </div>

              <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-slate-800 p-2">
                {uploads.map((upload) => (
                  <div
                    key={upload.file.name}
                    className="flex items-center gap-3 rounded bg-slate-900/50 p-2"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-800">
                      {upload.file.type.startsWith('image/') ? (
                        <FileImage size={20} className="text-slate-400" />
                      ) : (
                        <FileVideo size={20} className="text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-300">
                        {upload.file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(upload.file.size)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {upload.status === 'completed' ? (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <Check size={14} />
                          {mediaUploadModalContent.list.completed}
                        </span>
                      ) : upload.status === 'error' ? (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle size={14} />
                          {mediaUploadModalContent.list.error}
                        </span>
                      ) : (
                        <span className="text-xs text-brand-400">
                          {formatUploadStatus(upload.status, adminLocale)}
                        </span>
                      )}

                      {!isUploading && (
                        <button
                          onClick={() => removeUpload(upload.file)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {originalSize > 0 && completedCount > 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  {mediaUploadModalContent.list.originalSize(formatFileSize(originalSize))}
                </div>
              )}
            </div>
          )}

          {isUploading && (
            <div className="rounded-lg bg-slate-800 p-3">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-300">{mediaUploadModalContent.progress.uploading}</span>
                <span className="text-slate-400">
                  {completedCount + errorCount} / {totalCount}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{
                    width: `${((completedCount + errorCount) / totalCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 transition-colors hover:text-white disabled:opacity-50"
          >
            {hasCompleted ? mediaUploadModalContent.actions.close : mediaUploadModalContent.actions.cancel}
          </button>

          {hasCompleted ? (
            <button
              onClick={handleComplete}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-400"
            >
              {mediaUploadModalContent.actions.done(completedCount)}
            </button>
          ) : totalCount > 0 ? (
            <button
              onClick={() => handleFileSelect(null)}
              disabled={isUploading}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-400 disabled:opacity-50"
            >
              {isUploading ? mediaUploadModalContent.actions.uploading : mediaUploadModalContent.actions.upload}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const MediaUploadModal = (props: MediaUploadModalProps) => {
  if (!props.isOpen) {
    return null;
  }

  return <MediaUploadModalContent {...props} />;
};

export default MediaUploadModal;
