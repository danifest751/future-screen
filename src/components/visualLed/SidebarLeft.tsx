import CabinetPanel from './panels/CabinetPanel';
import ReportPanel from './panels/ReportPanel';
import ScalePanel from './panels/ScalePanel';
import ScreensPanel from './panels/ScreensPanel';
import SelectionPanel from './panels/SelectionPanel';

/**
 * Left sidebar — scale, screens, selection, cabinets, assist.
 * Phase 3: Scale + Screens + Selection.
 * Phase 4: Cabinets (this commit); Assist + Save project come next.
 */
const SidebarLeft = () => {
  return (
    <aside className="flex w-full flex-col gap-2 lg:w-72">
      <ScalePanel />
      <ScreensPanel />
      <SelectionPanel />
      <CabinetPanel />
      <ReportPanel />
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Assist
          </h2>
          <span className="text-[9px] text-slate-600">Phase 4c</span>
        </div>
        <div className="rounded-md border border-dashed border-white/10 bg-slate-950/40 px-2 py-2 text-[10px] text-slate-500">
          Полуавтоматический контур — следующая итерация
        </div>
      </div>
    </aside>
  );
};

export default SidebarLeft;
