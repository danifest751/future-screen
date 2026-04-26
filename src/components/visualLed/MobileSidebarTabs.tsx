import { useState } from 'react';
import {
  FileText,
  Grid3x3,
  Monitor,
  MousePointer2,
  Ruler,
  Save,
  X,
} from 'lucide-react';
import { CollapsiblePanelAlwaysOpen } from './CollapsiblePanel';
import CabinetPanel from './panels/CabinetPanel';
import ReportPanel from './panels/ReportPanel';
import SavePanel from './panels/SavePanel';
import ScalePanel from './panels/ScalePanel';
import ScreensPanel from './panels/ScreensPanel';
import SelectionPanel from './panels/SelectionPanel';

type PanelKey = 'scale' | 'screens' | 'selection' | 'cabinets' | 'report' | 'save';

const TABS: Array<{
  key: PanelKey;
  label: string;
  Icon: typeof Ruler;
  Panel: () => JSX.Element;
}> = [
  { key: 'scale', label: 'Масштаб', Icon: Ruler, Panel: ScalePanel },
  { key: 'screens', label: 'Экраны', Icon: Monitor, Panel: ScreensPanel },
  { key: 'selection', label: 'Выбор', Icon: MousePointer2, Panel: SelectionPanel },
  { key: 'cabinets', label: 'Кабинеты', Icon: Grid3x3, Panel: CabinetPanel },
  { key: 'report', label: 'Отчёт', Icon: FileText, Panel: ReportPanel },
  { key: 'save', label: 'Сохр', Icon: Save, Panel: SavePanel },
];

/**
 * Bottom tab bar with slide-up drawer, visible only on `<lg`. Each tab
 * opens a drawer containing the corresponding SidebarLeft panel. The
 * inline SidebarLeft is hidden on `<lg` (see VisualLedV2Page) so the
 * same panel isn't rendered twice.
 *
 * Tap on the active tab — closes the drawer (toggle behaviour).
 * Tap outside the drawer — closes the drawer (overlay click).
 */
const MobileSidebarTabs = () => {
  const [activeKey, setActiveKey] = useState<PanelKey | null>(null);
  const active = TABS.find((tab) => tab.key === activeKey);

  return (
    <>
      {active ? (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setActiveKey(null)}
          aria-hidden="true"
        >
          <div
            className="absolute bottom-12 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-xl border border-white/10 bg-slate-900 p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={active.label}
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">{active.label}</h2>
              <button
                type="button"
                onClick={() => setActiveKey(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <CollapsiblePanelAlwaysOpen>
              <active.Panel />
            </CollapsiblePanelAlwaysOpen>
          </div>
        </div>
      ) : null}

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-white/10 bg-slate-950/95 backdrop-blur lg:hidden"
        aria-label="Инструменты"
      >
        {TABS.map(({ key, label, Icon }) => {
          const isActive = key === activeKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(isActive ? null : key)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] transition ${
                isActive
                  ? 'bg-brand-500/15 text-brand-200'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label={label}
              aria-pressed={isActive}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default MobileSidebarTabs;
