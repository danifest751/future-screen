import { memo, useState } from 'react';
import { Check, Edit2, Film, ImageIcon, Info, Play, Trash2, X as CloseIcon } from 'lucide-react';
import { mediaCardContent } from '../../../content/components/mediaCard';
import { mediaLibraryContent } from '../../../content/components/mediaLibrary';
import { formatFileSize } from '../../../lib/imageCompression';
import type { MediaItem } from '../../../types/media';

interface MediaCardProps {
  media: MediaItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit?: (media: MediaItem) => void;
  onDelete?: (media: MediaItem) => void;
  onShowDetails?: (media: MediaItem) => void;
  selectable?: boolean;
  showActions?: boolean;
}

export const MediaCard = memo(function MediaCard({
  media,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onShowDetails,
  selectable = true,
  showActions = true,
}: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const isVideo = media.type === 'video';

  const handleImageError = () => {
    setImageError(true);
  };

  const handleVideoClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isVideo) {
      setVideoModalOpen(true);
    }
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border transition-all duration-200 ${
        isSelected ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/50' : 'border-white/10 bg-slate-800 hover:border-white/20'
      }`}
    >
      {selectable && (
        <div className="absolute left-1.5 top-1.5 z-30">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelect();
            }}
            className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
              isSelected ? 'border-brand-500 bg-brand-500 text-white' : 'border-white/30 bg-black/50 text-transparent hover:border-white/50'
            }`}
          >
            <Check size={12} />
          </button>
        </div>
      )}

      {showActions && (
        <div className="absolute right-1.5 top-1.5 z-30 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onShowDetails && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onShowDetails(media);
              }}
              className="flex h-6 w-6 items-center justify-center rounded bg-slate-700/90 text-slate-300 transition-colors hover:bg-sky-500 hover:text-white"
              title={mediaLibraryContent.details.triggerTitle}
            >
              <Info size={14} />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onEdit(media);
              }}
              className="flex h-6 w-6 items-center justify-center rounded bg-slate-700/90 text-slate-300 transition-colors hover:bg-brand-500 hover:text-white"
              title={mediaCardContent.actions.editTitle}
            >
              <Edit2 size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDelete(media);
              }}
              className="flex h-6 w-6 items-center justify-center rounded bg-slate-700/90 text-slate-300 transition-colors hover:bg-red-500 hover:text-white"
              title={mediaCardContent.actions.deleteTitle}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}

      <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
        {isVideo ? (
          <>
            {media.thumbnail_url && !imageError ? (
              <>
                <img
                  src={media.thumbnail_url}
                  alt={media.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={handleImageError}
                  loading="lazy"
                />
                <div className="absolute inset-0 cursor-pointer" onClick={onToggleSelect} />
              </>
            ) : (
              <div className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 bg-slate-800" onClick={onToggleSelect}>
                <Film size={36} className="text-slate-500" />
                <span className="text-xs text-slate-500">{mediaCardContent.labels.video}</span>
              </div>
            )}
            <button
              onClick={handleVideoClick}
              className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center"
              title={mediaCardContent.actions.previewVideoTitle}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform hover:scale-110">
                <Play size={18} fill="currentColor" />
              </div>
            </button>
          </>
        ) : !imageError ? (
          <>
            <img
              src={media.public_url}
              alt={media.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleImageError}
              loading="lazy"
            />
            <div className="absolute inset-0 cursor-pointer" onClick={onToggleSelect} />
          </>
        ) : (
          <div className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-slate-500" onClick={onToggleSelect}>
            <ImageIcon size={32} />
            <span className="text-xs">{mediaCardContent.labels.imageFallback}</span>
          </div>
        )}

        <div className="absolute bottom-1.5 left-1.5">
          <span className={`rounded px-1.5 py-px text-[10px] font-medium uppercase ${isVideo ? 'bg-purple-500/80 text-white' : 'bg-slate-700/80 text-slate-300'}`}>
            {isVideo ? mediaCardContent.labels.video : mediaCardContent.labels.photo}
          </span>
        </div>

        <div className="absolute bottom-1.5 right-1.5">
          <span className="rounded bg-black/60 px-1.5 py-px text-[10px] text-slate-300">{formatFileSize(media.size_bytes)}</span>
        </div>
      </div>

      <div className="p-1.5">
        <p className="truncate text-xs text-slate-400" title={media.name}>
          {media.name}
        </p>

        {media.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {media.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded bg-slate-700 px-1.5 py-px text-[10px] text-slate-300">
                {tag}
              </span>
            ))}
            {media.tags.length > 2 && <span className="rounded bg-slate-700 px-1.5 py-px text-[10px] text-slate-400">+{media.tags.length - 2}</span>}
          </div>
        )}

        {!isVideo && media.width && media.height && <p className="mt-1 text-[10px] text-slate-500">{media.width}x{media.height}</p>}

        {isVideo && media.duration && <p className="mt-1 text-[10px] text-slate-500">{formatDuration(media.duration)}</p>}
      </div>

      {videoModalOpen && isVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setVideoModalOpen(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-4xl">
            <button
              onClick={() => setVideoModalOpen(false)}
              className="absolute -top-10 right-0 flex items-center gap-1 rounded bg-slate-800 px-3 py-1.5 text-sm text-white transition-colors hover:bg-slate-700"
            >
              <CloseIcon size={16} />
              {mediaCardContent.actions.close}
            </button>

            <div className="overflow-hidden rounded-lg bg-black shadow-2xl">
              <video
                src={media.public_url}
                controls
                autoPlay
                className="max-h-[80vh] w-full"
                onClick={(event) => event.stopPropagation()}
              >
                {mediaCardContent.labels.browserUnsupported}
              </video>
            </div>

            <p className="mt-3 text-center text-sm text-white">{media.name}</p>
          </div>
        </div>
      )}
    </div>
  );
});

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}${mediaCardContent.duration.secondsSuffix}`;
  return `${mins}${mediaCardContent.duration.minutesSuffix} ${secs.toString().padStart(2, '0')}${mediaCardContent.duration.secondsSuffix}`;
}

export default MediaCard;
