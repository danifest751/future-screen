import { useState } from 'react';
import { Pencil, Plus, X } from 'lucide-react';
import { useVisualLed } from './state/VisualLedContext';

/**
 * Top scene tabs — create / switch / rename / (future) remove.
 * Uses an inline input for rename (no `prompt()` — matches modern UX of
 * the rest of the admin; the legacy version used `prompt()`).
 */
const ScenesTabs = () => {
  const { state, dispatch } = useVisualLed();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameDraft(currentName);
  };

  const commitRename = () => {
    if (renamingId && renameDraft.trim()) {
      dispatch({ type: 'scene/rename', payload: { id: renamingId, name: renameDraft.trim() } });
    }
    setRenamingId(null);
    setRenameDraft('');
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {state.scenes.map((scene) => {
        const isActive = scene.id === state.activeSceneId;
        const isRenaming = renamingId === scene.id;
        return (
          <div
            key={scene.id}
            className={`group flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
              isActive
                ? 'border-brand-400 bg-brand-500/20 text-white'
                : 'border-white/10 bg-slate-900/40 text-slate-300 hover:border-white/30 hover:text-white'
            }`}
          >
            {isRenaming ? (
              <input
                autoFocus
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') {
                    setRenamingId(null);
                    setRenameDraft('');
                  }
                }}
                className="w-28 bg-transparent px-1 text-xs outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => dispatch({ type: 'scene/switch', payload: { id: scene.id } })}
                onDoubleClick={() => startRename(scene.id, scene.name)}
                className="px-1"
              >
                {scene.name}
              </button>
            )}
            {isActive && !isRenaming ? (
              <button
                type="button"
                onClick={() => startRename(scene.id, scene.name)}
                className="rounded p-0.5 text-slate-400 hover:bg-white/10 hover:text-white"
                title="Переименовать"
              >
                <Pencil className="h-3 w-3" />
              </button>
            ) : null}
            {state.scenes.length > 1 && !isRenaming ? (
              <button
                type="button"
                onClick={() => dispatch({ type: 'scene/remove', payload: { id: scene.id } })}
                className="rounded p-0.5 text-slate-500 opacity-0 transition hover:bg-red-500/20 hover:text-red-300 group-hover:opacity-100"
                title="Удалить сцену"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => dispatch({ type: 'scene/add', payload: {} })}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-slate-900/40 text-slate-400 hover:border-white/30 hover:text-white"
        title="Добавить сцену"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
};

export default ScenesTabs;
