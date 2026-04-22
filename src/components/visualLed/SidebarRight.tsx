import { useRef, type ReactNode } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { importBackgrounds } from './CanvasStage';
import { useActiveScene, useVisualLed } from './state/VisualLedContext';

/**
 * Right sidebar — backgrounds library (working in phase 3) + videos
 * library (placeholder, phase 4).
 */
const SidebarRight = () => {
  const scene = useActiveScene();
  const { dispatch } = useVisualLed();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    await importBackgrounds(Array.from(files), dispatch);
  };

  return (
    <aside className="flex w-full flex-col gap-2 lg:w-64">
      <Panel title="Фоны">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-slate-950/40 py-3 text-xs text-slate-300 hover:border-white/30 hover:text-white">
          <Upload className="h-3.5 w-3.5" />
          Загрузить
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void onFiles(e.target.files);
              if (fileInputRef.current) fileInputRef.current.value = '';
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

      <Panel title="Видео" hint="Фаза 4">
        <div className="rounded-md border border-dashed border-white/10 bg-slate-950/40 p-4 text-center text-[11px] text-slate-500">
          Назначение видео на экран — следующая фаза
        </div>
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
