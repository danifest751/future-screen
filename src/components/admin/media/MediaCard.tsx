import { memo, useState } from 'react';
import { Play, Check, X, ImageIcon, Film, Edit2, Trash2, X as CloseIcon } from 'lucide-react';
import type { MediaItem } from '../../../types/media';
import { formatFileSize } from '../../../lib/imageCompression';

interface MediaCardProps {
  media: MediaItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit?: (media: MediaItem) => void;
  onDelete?: (media: MediaItem) => void;
  selectable?: boolean;
  showActions?: boolean;
}

export const MediaCard = memo(function MediaCard({
  media,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  selectable = true,
  showActions = true,
}: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const isVideo = media.type === 'video';

  const handleImageError = () => {
    setImageError(true);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVideo) {
      setVideoModalOpen(true);
    }
  };

  return (
    <div
      className={`
        group relative overflow-hidden rounded-lg border transition-all duration-200
        ${isSelected 
          ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/50' 
          : 'border-white/10 bg-slate-800 hover:border-white/20'
        }
      `}
    >
      {/* Checkbox */}
      {selectable && (
        <div className="absolute left-2 top-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            className={`
              flex h-5 w-5 items-center justify-center rounded border transition-colors
              ${isSelected 
                ? 'border-brand-500 bg-brand-500 text-white' 
                : 'border-white/30 bg-black/50 text-transparent hover:border-white/50'
              }
            `}
          >
            <Check size={12} />
          </button>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(media);
              }}
              className="flex h-7 w-7 items-center justify-center rounded bg-slate-700/90 text-slate-300 transition-colors hover:bg-brand-500 hover:text-white"
              title="Редактировать"
            >
              <Edit2 size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(media);
              }}
              className="flex h-7 w-7 items-center justify-center rounded bg-slate-700/90 text-slate-300 transition-colors hover:bg-red-500 hover:text-white"
              title="Удалить"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}

      {/* Media Preview */}
      <div className="relative aspect-square overflow-hidden bg-slate-900">
        {!imageError ? (
          <>
            <img
              src={isVideo && media.thumbnail_url ? media.thumbnail_url : media.public_url}
              alt={media.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleImageError}
              loading="lazy"
            />
            {/* Selection overlay */}
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={onToggleSelect}
            />
            {/* Video Play Button - higher z-index */}
            {isVideo && (
              <button
                onClick={handleVideoClick}
                className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
                title="Нажмите для просмотра видео"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform hover:scale-110">
                  <Play size={20} fill="currentColor" />
                </div>
              </button>
            )}
          </>
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-500 cursor-pointer"
            onClick={onToggleSelect}
          >
            {isVideo ? <Film size={32} /> : <ImageIcon size={32} />}
            <span className="text-xs">{isVideo ? 'Видео' : 'Изображение'}</span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute bottom-2 left-2">
          <span className={`
            rounded px-2 py-0.5 text-[10px] font-medium uppercase
            ${isVideo 
              ? 'bg-purple-500/80 text-white' 
              : 'bg-slate-700/80 text-slate-300'
            }
          `}>
            {isVideo ? 'Видео' : 'Фото'}
          </span>
        </div>

        {/* Size Badge */}
        <div className="absolute bottom-2 right-2">
          <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] text-slate-300">
            {formatFileSize(media.size_bytes)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="truncate text-xs text-slate-400" title={media.name}>
          {media.name}
        </p>
        
        {/* Tags */}
        {media.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {media.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300"
              >
                {tag}
              </span>
            ))}
            {media.tags.length > 3 && (
              <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
                +{media.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Dimensions for images */}
        {!isVideo && media.width && media.height && (
          <p className="mt-1 text-[10px] text-slate-500">
            {media.width}×{media.height}
          </p>
        )}

        {/* Duration for videos */}
        {isVideo && media.duration && (
          <p className="mt-1 text-[10px] text-slate-500">
            {formatDuration(media.duration)}
          </p>
        )}
      </div>

      {/* Video Modal */}
      {videoModalOpen && isVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setVideoModalOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* Video Container */}
          <div className="relative z-10 w-full max-w-4xl">
            {/* Close button */}
            <button
              onClick={() => setVideoModalOpen(false)}
              className="absolute -top-10 right-0 flex items-center gap-1 rounded bg-slate-800 px-3 py-1.5 text-sm text-white transition-colors hover:bg-slate-700"
            >
              <CloseIcon size={16} />
              Закрыть
            </button>
            
            {/* Video Player */}
            <div className="overflow-hidden rounded-lg bg-black shadow-2xl">
              <video
                src={media.public_url}
                controls
                autoPlay
                className="max-h-[80vh] w-full"
                onClick={(e) => e.stopPropagation()}
              >
                Ваш браузер не поддерживает воспроизведение видео.
              </video>
            </div>
            
            {/* Video Name */}
            <p className="mt-3 text-center text-sm text-white">
              {media.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}с`;
  return `${mins}м ${secs.toString().padStart(2, '0')}с`;
}

export default MediaCard;
