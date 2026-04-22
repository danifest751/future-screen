import { useRef, type ReactNode } from 'react';
import { Film, Upload, Trash2, XCircle } from 'lucide-react';
import { importBackgrounds } from './CanvasStage';
import { fileToDataUrl } from './imageLoader';
import { uid } from './state/initialState';
import { useActiveScene, useSelectedElement, useVisualLed } from './state/VisualLedContext';

/**
 * Right sidebar — backgrounds + videos libraries.
 * Phase 4: videos become functional — upload, assign to selected
 * screen, remove from library.
 */
const SidebarRight = () => {
  const scene = useActiveScene();
  const selected = useSelectedElement();
  const { state, dispatch } = useVisualLed();
  const bgInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const onBackgroundFiles = async (files: FileList | null) => {
    if (!files) return;
    await importBackgrounds(Array.from(files), dispatch);
  };

  const onVideoFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('video/')) continue;
      try {
        const src = await fileToDataUrl(file);
        dispatch({
          type: 'video/add',
          payload: { id: uid('vid'), name: file.name, src },
        });
      } catch (err) {
        console.warn('Failed to import video', file.name, err);
      }
    }
  };

  const assignVideo = (videoId: string) => {
    if (!selected) return;
    dispatch({ type: 'screen/update', payload: { id: selected.id, patch: { videoId } } });
  };

  const clearAssignment = () => {
    if (!selected || !selected.videoId) return;
    dispatch({ type: 'screen/update', payload: { id: selected.id, patch: { videoId: null } } });
  };

  return (
    <aside className="flex w-full flex-col gap-2 lg:w-64">
      <Panel title="Фоны">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-slate-950/40 py-3 text-xs text-slate-300 hover:border-white/30 hover:text-white">
          <Upload className="h-3.5 w-3.5" />
          Загрузить
          <input
            ref={bgInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void onBackgroundFiles(e.target.files);
              if (bgInputRef.current) bgInputRef.current.value = '';
            }}
          />
        </label>
        {scene.backgrounds.length === 0 ? (
          <div className="mt-2 rounded-md border border-dashed border-white/10 bg-slate-950/40 p-3 text-center text-[11px] text-slate-500">
            Или перетащи файлы на canvas
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {scene.backgrounds.map((bg) => {
              const isActive = bg.id === scene.activeBackgroundId;
              return (
                <div
                  key={bg.id}
                  className={`group relative overflow-hidden rounded-md border ${
                    isActive ? 'border-brand-400' : 'border-white/10'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({ type: 'background/select', payload: { id: bg.id } })
                    }
                    className="block w-full"
                    title={bg.name}
                  >
                    <img
                      src={bg.src}
                      alt={bg.name}
                      className="block aspect-video w-full object-cover"
                      draggable={false}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({ type: 'background/remove', payload: { id: bg.id } })
                    }
                    className="absolute right-1 top-1 hidden rounded bg-black/60 p-0.5 text-slate-300 hover:text-red-300 group-hover:inline-block"
                    title="Удалить фон"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Видео">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-slate-950/40 py-3 text-xs text-slate-300 hover:border-white/30 hover:text-white">
          <Upload className="h-3.5 w-3.5" />
          Загрузить
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm"
            multiple
            className="hidden"
            onChange={(e) => {
              void onVideoFiles(e.target.files);
              if (videoInputRef.current) videoInputRef.current.value = '';
            }}
          />
        </label>

        {state.videos.length === 0 ? (
          <div className="mt-2 rounded-md border border-dashed border-white/10 bg-slate-950/40 p-3 text-center text-[11px] text-slate-500">
            MP4 / WebM — клик по ролику назначит его выбранному экрану
          </div>
        ) : (
          <>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {state.videos.map((video) => {
                const isAssigned = selected?.videoId === video.id;
                return (
                  <div
                    key={video.id}
                    className={`group relative overflow-hidden rounded-md border ${
                      isAssigned ? 'border-brand-400' : 'border-white/10'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => assignVideo(video.id)}
                      disabled={!selected}
                      className="block w-full bg-slate-950/60 disabled:cursor-not-allowed disabled:opacity-50"
                      title={selected ? `Назначить ${video.name}` : 'Выбери экран'}
                    >
                      <video
                        src={video.src}
                        className="block aspect-video w-full object-cover"
                        muted
                        loop
                        autoPlay
                        playsInline
                        preload="metadata"
                      />
                      <div className="truncate px-1.5 py-0.5 text-[10px] text-slate-300">
                        {video.name}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'video/remove', payload: { id: video.id } })}
                      className="absolute right-1 top-1 hidden rounded bg-black/60 p-0.5 text-slate-300 hover:text-red-300 group-hover:inline-block"
                      title="Удалить из библиотеки"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    {isAssigned ? (
                      <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-brand-500/80 px-1 py-0.5 text-[9px] font-semibold uppercase text-white">
                        <Film className="h-2.5 w-2.5" />
                        on
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {selected?.videoId ? (
              <button
                type="button"
                onClick={clearAssignment}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-white/15 bg-slate-900 px-2 py-1 text-[11px] text-white hover:border-white/30"
              >
                <XCircle className="h-3 w-3" />
                Снять видео с «{selected.name}»
              </button>
            ) : null}
          </>
        )}
      </Panel>
    </aside>
  );
};

const Panel = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) => (
  <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
      {hint ? <span className="text-[9px] text-slate-600">{hint}</span> : null}
    </div>
    {children}
  </div>
);

export default SidebarRight;
