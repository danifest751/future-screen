import { useState } from 'react';
import { Film, GripVertical, Image, Plus, Trash2, X } from 'lucide-react';
import { caseMediaSelectorContent } from '../../../content/components/caseMediaSelector';
import type { MediaItem } from '../../../types/media';
import { MediaLibrary } from '../media';

interface CaseMediaSelectorProps {
  selectedMedia: MediaItem[];
  onChange: (media: MediaItem[]) => void;
}

export const CaseMediaSelector = ({ selectedMedia, onChange }: CaseMediaSelectorProps) => {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleSelect = (media: MediaItem) => {
    const exists = selectedMedia.find((item) => item.id === media.id);
    if (exists) {
      onChange(selectedMedia.filter((item) => item.id !== media.id));
    } else {
      onChange([...selectedMedia, media]);
    }
  };

  const handleRemove = (mediaId: string) => {
    onChange(selectedMedia.filter((item) => item.id !== mediaId));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (event: React.DragEvent, index: number) => {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newMedia = [...selectedMedia];
    const draggedItem = newMedia[draggedIndex];
    newMedia.splice(draggedIndex, 1);
    newMedia.splice(index, 0, draggedItem);
    onChange(newMedia);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const imageCount = selectedMedia.filter((item) => item.type === 'image').length;
  const videoCount = selectedMedia.filter((item) => item.type === 'video').length;

  const renderMediaPreview = (media: MediaItem, className = 'h-full w-full object-cover') => {
    if (media.type === 'video') {
      if (media.thumbnail_url) {
        return <img src={media.thumbnail_url} alt={media.name} className={className} />;
      }
      return (
        <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500">
          <Film size={18} />
        </div>
      );
    }

    return <img src={media.public_url} alt={media.name} className={className} />;
  };

  return (
    <>
      {isSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSelectorOpen(false)} />
          <div className="relative flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold text-white">{caseMediaSelectorContent.modal.title}</h2>
                <p className="text-xs text-slate-400">
                  {caseMediaSelectorContent.modal.selectedSummary(selectedMedia.length, imageCount, videoCount)}
                </p>
              </div>
              <button
                onClick={() => setIsSelectorOpen(false)}
                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-h-0 overflow-y-auto p-4">
                <MediaLibrary
                  selectable
                  selectedIds={selectedMedia.map((item) => item.id)}
                  onSelect={handleSelect}
                  showUploadButton
                />
              </div>

              <aside className="flex min-h-0 flex-col border-t border-white/10 bg-slate-950/50 lg:border-l lg:border-t-0">
                <div className="border-b border-white/10 px-4 py-3">
                  <div className="text-sm font-semibold text-white">{caseMediaSelectorContent.modal.selectedTitle}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {caseMediaSelectorContent.preview.selectedFiles(selectedMedia.length, imageCount, videoCount)}
                  </div>
                </div>

                <div className="min-h-[180px] flex-1 overflow-y-auto p-3">
                  {selectedMedia.length > 0 ? (
                    <div className="space-y-2">
                      {selectedMedia.map((media, index) => (
                        <div
                          key={media.id}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(event) => handleDragOver(event, index)}
                          onDragEnd={handleDragEnd}
                          className={`group flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-2 ${
                            draggedIndex === index ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/40 text-xs font-bold text-white">
                            {index + 1}
                          </div>
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-slate-800">
                            {renderMediaPreview(media)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-white">{media.name}</div>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                              <GripVertical size={12} className="cursor-grab active:cursor-grabbing" />
                              <span>{media.type === 'video' ? caseMediaSelectorContent.preview.video : caseMediaSelectorContent.preview.photo}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemove(media.id)}
                            title={caseMediaSelectorContent.preview.remove}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-400/30 bg-red-500/10 text-red-100 opacity-80 transition hover:border-red-400/60 hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[180px] items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.03] px-4 text-center text-sm text-slate-500">
                      {caseMediaSelectorContent.modal.selectedEmpty}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 p-3">
                  <button
                    onClick={() => setIsSelectorOpen(false)}
                    className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-400"
                  >
                    {caseMediaSelectorContent.modal.done(selectedMedia.length)}
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {selectedMedia.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">
                {caseMediaSelectorContent.preview.selectedFiles(selectedMedia.length, imageCount, videoCount)}
              </span>
              <button type="button" onClick={() => setIsSelectorOpen(true)} className="text-sm text-brand-400 hover:text-brand-300">
                {caseMediaSelectorContent.preview.edit}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {selectedMedia.map((media, index) => (
                <div
                  key={media.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(event) => handleDragOver(event, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative overflow-hidden rounded-lg border border-white/10 bg-slate-800 ${draggedIndex === index ? 'opacity-50' : ''}`}
                >
                  <div className="absolute left-1 top-1 z-10 cursor-grab rounded bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                    <GripVertical size={12} />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(media.id)}
                    className="absolute right-1 top-1 z-10 rounded bg-red-500/80 p-1 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>

                  <div className="aspect-square">
                    {renderMediaPreview(media)}
                  </div>

                  <div className="absolute bottom-1 left-1">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                        media.type === 'video' ? 'bg-purple-500/80 text-white' : 'bg-slate-700/80 text-slate-300'
                      }`}
                    >
                      {media.type === 'video' ? caseMediaSelectorContent.preview.video : caseMediaSelectorContent.preview.photo}
                    </span>
                  </div>

                  <div className="absolute bottom-1 right-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-slate-800/50 text-slate-500 transition-colors hover:border-white/40 hover:text-slate-300"
              >
                <Plus size={24} />
                <span className="text-xs">{caseMediaSelectorContent.preview.add}</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">{caseMediaSelectorContent.preview.reorderHint}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsSelectorOpen(true)}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-slate-800/50 py-8 text-slate-500 transition-colors hover:border-white/40 hover:text-slate-300"
          >
            <div className="flex gap-2">
              <Image size={24} />
              <Film size={24} />
            </div>
            <span className="text-sm">{caseMediaSelectorContent.preview.emptyTitle}</span>
            <span className="text-xs text-slate-600">{caseMediaSelectorContent.preview.emptyHint}</span>
          </button>
        )}
      </div>
    </>
  );
};

export default CaseMediaSelector;
