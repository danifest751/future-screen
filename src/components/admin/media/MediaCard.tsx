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
      className={`group relative overflow-hidden rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-200 active:scale-[0.995] ${
        isSelected ? 'border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30' : 'border-white/10 bg-slate-900/70 hover:border-white/20 hover:bg-slate-900'
      }`}
    >
      {selectable && (
        <div className="absolute left-1.5 top-1.5 z-30">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelect();
            }}
            className={`flex h-5 w-5 items-center justify-center rounded border backdrop-blur-sm transition ${
              isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-white/30 bg-slate-950/70 text-transparent hover:border-white/50'
            }`}
          >
            <Check size={12} />
          </button>
        </div>
      )}

      {showActions && (
        <div className="absolute right-1.5 top-1.5 z-30 flex gap-1">
          {onShowDetails && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onShowDetails(media);
              }}
              className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-slate-950/80 text-slate-300 backdrop-blur-sm transition hover:border-white/30 hover:text-white active:scale-[0.94]"
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
              className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-slate-950/80 text-slate-300 backdrop-blur-sm transition hover:border-emerald-500/40 hover:text-white active:scale-[0.94]"
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
              className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-slate-950/80 text-slate-300 backdrop-blur-sm transition hover:border-red-400/50 hover:text-red-100 active:scale-[0.94]"
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-white backdrop-blur-sm transition-transform hover:scale-110">
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
          <span className={`rounded border px-1.5 py-px text-[10px] font-medium uppercase backdrop-blur-sm ${isVideo ? 'border-white/10 bg-slate-950/75 text-slate-100' : 'border-white/10 bg-slate-800/80 text-slate-300'}`}>
            {isVideo ? mediaCardContent.labels.video : mediaCardContent.labels.photo}
          </span>
        </div>

        <div className="absolute bottom-1.5 right-1.5">
          <span className="rounded border border-white/10 bg-slate-950/75 px-1.5 py-px text-[10px] text-slate-300 backdrop-blur-sm">{formatFileSize(media.size_bytes)}</span>
        </div>
      </div>

      <div className="p-2">
        <p className="truncate text-xs font-medium text-slate-200" title={media.name}>
          {media.name}
        </p>

        {media.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {media.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded border border-white/10 bg-slate-800 px-1.5 py-px text-[10px] text-slate-300">
                {tag}
              </span>
            ))}
            {media.tags.length > 2 && <span className="rounded border border-white/10 bg-slate-800 px-1.5 py-px text-[10px] text-slate-400">+{media.tags.length - 2}</span>}
          </div>
        )}

        {!isVideo && media.width && media.height && <p className="mt-1 text-[10px] text-slate-500">{media.width}x{media.height}</p>}

        {isVideo && media.duration && <p className="mt-1 text-[10px] text-slate-500">{formatDuration(media.duration)}</p>}
      </div>

      {videoModalOpen && isVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setVideoModalOpen(false)}>
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-4xl">
            <button
              onClick={() => setVideoModalOpen(false)}
              className="absolute -top-10 right-0 flex items-center gap-1 rounded bg-slate-800 px-3 py-1.5 text-sm text-white transition hover:bg-slate-700 active:scale-[0.98]"
            >
              <CloseIcon size={16} />
              {mediaCardContent.actions.close}
            </button>

            <div className="overflow-hidden rounded-xl bg-slate-950 shadow-2xl">
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
