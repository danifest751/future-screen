import type { ReactNode } from 'react';
import ScalePanel from './panels/ScalePanel';
import ScreensPanel from './panels/ScreensPanel';
import SelectionPanel from './panels/SelectionPanel';

/**
 * Left sidebar — scale, screens, selection, cabinets, assist.
 * Phase 3 ships Scale + Screens + Selection; Cabinets + Assist come later.
 */
const SidebarLeft = () => {
  return (
    <aside className="flex w-full flex-col gap-2 lg:w-72">
      <ScalePanel />
      <ScreensPanel />
      <SelectionPanel />
      <PlaceholderPanel title="Кабинеты 0.5 × 0.5" hint="Фаза 4" />
      <PlaceholderPanel title="Assist" hint="Фаза 4" />
    </aside>
  );
};

const PlaceholderPanel = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children?: ReactNode;
}) => (
  <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
      {hint ? <span className="text-[9px] text-slate-600">{hint}</span> : null}
    </div>
    <div className="rounded-md border border-dashed border-white/10 bg-slate-950/40 px-2 py-2 text-[10px] text-slate-500">
      {children ?? 'Появится в следующей фазе'}
    </div>
  </div>
);

export default SidebarLeft;
