import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, Film, ImageIcon, X } from 'lucide-react';
import { formatFileSize } from '../../../lib/imageCompression';
import { loadMediaUsage, type MediaUsageEntry } from '../../../services/mediaUsage';
import type { MediaItem } from '../../../types/media';

interface MediaDetailsModalProps {
  media: MediaItem | null;
  onClose: () => void;
  copy: {
    title: string;
    close: string;
    sections: { preview: string; meta: string; usage: string };
    fields: {
      type: string;
      size: string;
      dimensions: string;
      duration: string;
      uploaded: string;
      uploadedBy: string;
      tags: string;
      url: string;
    };
    typeLabels: { image: string; video: string };
    usageLoading: string;
    usageEmpty: string;
    usageItem: (title: string) => string;
    copyLink: string;
    openExternal: string;
    copySuccess: string;
    copyError: string;
  };
  formatDate: (iso: string) => string;
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const MediaDetailsModal = ({ media, onClose, copy, formatDate }: MediaDetailsModalProps) => {
  const [usage, setUsage] = useState<MediaUsageEntry[] | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  useEffect(() => {
    if (!media) {
      setUsage(null);
      setUsageLoading(false);
      return;
    }
    let cancelled = false;
    setUsageLoading(true);
    setUsage(null);
    loadMediaUsage([media.id])
      .then((map) => {
        if (cancelled) return;
        setUsage(map.get(media.id) ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setUsage([]);
      })
      .finally(() => {
        if (!cancelled) setUsageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [media]);

  if (!media) return null;

  const isVideo = media.type === 'video';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(media.public_url);
      toast.success(copy.copySuccess);
    } catch {
      toast.error(copy.copyError);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10003] flex items-center justify-center bg-slate-950/80 p-3"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-slate-500">{copy.title}</div>
            <h2 className="mt-1 truncate text-lg font-semibold text-white" title={media.name}>{media.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="rounded-lg border border-white/10 bg-slate-900 p-1.5 text-slate-300 transition hover:border-white/30 hover:text-white active:scale-[0.94]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-auto p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section>
            <div className="mb-2 text-[11px] font-semibold uppercase text-slate-500">{copy.sections.preview}</div>
            <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950">
              {isVideo ? (
                <video src={media.public_url} controls className="max-h-[55vh] w-full" />
              ) : (
                <img src={media.public_url} alt={media.name} className="max-h-[55vh] w-full object-contain" />
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleCopyUrl()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 transition hover:border-white/30 hover:text-white active:scale-[0.98]"
              >
                <Copy className="h-3.5 w-3.5" />
                {copy.copyLink}
              </button>
              <a
                href={media.public_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 transition hover:border-white/30 hover:text-white active:scale-[0.98]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {copy.openExternal}
              </a>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase text-slate-500">{copy.sections.meta}</div>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-xs">
                <dt className="text-slate-500">{copy.fields.type}</dt>
                <dd className="flex items-center gap-1.5 text-slate-200">
                  {isVideo ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                  {isVideo ? copy.typeLabels.video : copy.typeLabels.image}
                </dd>

                <dt className="text-slate-500">{copy.fields.size}</dt>
                <dd className="text-slate-200">{formatFileSize(media.size_bytes)}</dd>

                {media.width && media.height && (
                  <>
                    <dt className="text-slate-500">{copy.fields.dimensions}</dt>
                    <dd className="text-slate-200">{media.width}×{media.height}</dd>
                  </>
                )}

                {isVideo && media.duration !== undefined && (
                  <>
                    <dt className="text-slate-500">{copy.fields.duration}</dt>
                    <dd className="text-slate-200">{formatDuration(media.duration)}</dd>
                  </>
                )}

                <dt className="text-slate-500">{copy.fields.uploaded}</dt>
                <dd className="text-slate-200">{formatDate(media.created_at)}</dd>

                <dt className="text-slate-500">{copy.fields.uploadedBy}</dt>
                <dd className="text-slate-200">{media.uploaded_by}</dd>

                <dt className="text-slate-500">{copy.fields.url}</dt>
                <dd className="break-all font-mono text-[11px] text-slate-300">{media.storage_path}</dd>
              </dl>

              {media.tags.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1 text-[11px] uppercase text-slate-500">{copy.fields.tags}</div>
                  <div className="flex flex-wrap gap-1">
                    {media.tags.map((tag) => (
                      <span key={tag} className="rounded border border-white/10 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase text-slate-500">{copy.sections.usage}</div>
              {usageLoading ? (
                <div className="rounded-lg border border-white/10 bg-slate-900/70 p-2">
                  <div className="mb-2 h-3 w-36 animate-pulse rounded bg-slate-800" />
                  <div className="h-3 w-52 animate-pulse rounded bg-slate-800" />
                  <div className="sr-only">{copy.usageLoading}</div>
                </div>
              ) : usage && usage.length > 0 ? (
                <ul className="space-y-1 text-xs text-slate-200">
                  {usage.map((entry) => (
                    <li
                      key={entry.caseId}
                      className="rounded border border-white/10 bg-slate-950/50 px-2 py-1"
                    >
                      {copy.usageItem(entry.caseTitle ?? entry.caseSlug ?? `case #${entry.caseId}`)}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-emerald-300">{copy.usageEmpty}</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MediaDetailsModal;
