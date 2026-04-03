import { useState } from 'react';
import { X, Image, Film, GripVertical, Trash2, Plus } from 'lucide-react';
import { MediaLibrary } from '../media';
import type { MediaItem } from '../../../types/media';

interface CaseMediaSelectorProps {
  selectedMedia: MediaItem[];
  onChange: (media: MediaItem[]) => void;
}

export const CaseMediaSelector = ({
  selectedMedia,
  onChange,
}: CaseMediaSelectorProps) => {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleSelect = (media: MediaItem) => {
    const exists = selectedMedia.find((m) => m.id === media.id);
    if (exists) {
      onChange(selectedMedia.filter((m) => m.id !== media.id));
    } else {
      onChange([...selectedMedia, media]);
    }
  };

  const handleRemove = (mediaId: string) => {
    onChange(selectedMedia.filter((m) => m.id !== mediaId));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
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

  const imageCount = selectedMedia.filter((m) => m.type === 'image').length;
  const videoCount = selectedMedia.filter((m) => m.type === 'video').length;

  return (
    <>
      {/* Media Selector Modal */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSelectorOpen(false)}
          />
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Выберите медиафайлы</h2>
                <p className="text-sm text-slate-400">
                  Выбрано: {selectedMedia.length} ({imageCount} фото, {videoCount} видео)
                </p>
              </div>
              <button
                onClick={() => setIsSelectorOpen(false)}
                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <MediaLibrary
                selectable
                selectedIds={selectedMedia.map((m) => m.id)}
                onSelect={handleSelect}
                showUploadButton={true}
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                onClick={() => setIsSelectorOpen(false)}
                className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-400"
              >
                Готово ({selectedMedia.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Media Preview */}
      <div className="space-y-3">
        {selectedMedia.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Выбрано: {selectedMedia.length} файлов
                {imageCount > 0 && ` • ${imageCount} фото`}
                {videoCount > 0 && ` • ${videoCount} видео`}
              </span>
              <button
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                className="text-sm text-brand-400 hover:text-brand-300"
              >
                Изменить
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {selectedMedia.map((media, index) => (
                <div
                  key={media.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    group relative overflow-hidden rounded-lg border border-white/10 bg-slate-800
                    ${draggedIndex === index ? 'opacity-50' : ''}
                  `}
                >
                  {/* Drag Handle */}
                  <div className="absolute left-1 top-1 z-10 cursor-grab rounded bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                    <GripVertical size={12} />
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(media.id)}
                    className="absolute right-1 top-1 z-10 rounded bg-red-500/80 p-1 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>

                  {/* Preview */}
                  <div className="aspect-square">
                    <img
                      src={media.public_url}
                      alt={media.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Type Badge */}
                  <div className="absolute bottom-1 left-1">
                    <span
                      className={`
                        rounded px-1.5 py-0.5 text-[10px] font-medium uppercase
                        ${media.type === 'video'
                          ? 'bg-purple-500/80 text-white'
                          : 'bg-slate-700/80 text-slate-300'
                        }
                      `}
                    >
                      {media.type === 'video' ? 'Видео' : 'Фото'}
                    </span>
                  </div>

                  {/* Order Number */}
                  <div className="absolute bottom-1 right-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                </div>
              ))}

              {/* Add More Button */}
              <button
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-slate-800/50 text-slate-500 transition-colors hover:border-white/40 hover:text-slate-300"
              >
                <Plus size={24} />
                <span className="text-xs">Добавить</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Перетащите файлы для изменения порядка отображения
            </p>
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
            <span className="text-sm">Выберите медиафайлы из библиотеки</span>
            <span className="text-xs text-slate-600">Нажмите для выбора</span>
          </button>
        )}
      </div>
    </>
  );
};

export default CaseMediaSelector;
