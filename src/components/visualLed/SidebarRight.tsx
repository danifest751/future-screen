import type { ReactNode } from 'react';

/**
 * Right sidebar — backgrounds and videos libraries. Phase 3 wires up
 * upload + drag-drop; phase 2 is a layout placeholder.
 */
const SidebarRight = () => {
  return (
    <aside className="flex w-full flex-col gap-2 lg:w-64">
      <Panel title="Фоны" hint="Фаза 3 — загрузка и drag-drop">
        <div className="rounded-md border border-dashed border-white/10 bg-slate-950/40 p-4 text-center text-[11px] text-slate-500">
          Перетащи файлы или нажми «Загрузить»
        </div>
      </Panel>
      <Panel title="Видео" hint="Фаза 4 — назначение на экран">
        <div className="rounded-md border border-dashed border-white/10 bg-slate-950/40 p-4 text-center text-[11px] text-slate-500">
          Видео-библиотека пуста
        </div>
      </Panel>
    </aside>
  );
};

const Panel = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
      {hint ? <span className="text-[9px] text-slate-600">{hint}</span> : null}
    </div>
    {children}
  </div>
);

export default SidebarRight;
