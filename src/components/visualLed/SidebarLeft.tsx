import CabinetPanel from './panels/CabinetPanel';
import ReportPanel from './panels/ReportPanel';
import SavePanel from './panels/SavePanel';
import ScalePanel from './panels/ScalePanel';
import ScreensPanel from './panels/ScreensPanel';
import SelectionPanel from './panels/SelectionPanel';

const SidebarLeft = () => {
  return (
    <aside className="flex w-full flex-col gap-2 lg:w-72">
      <ScalePanel />
      <ScreensPanel />
      <SelectionPanel />
      <CabinetPanel />
      <ReportPanel />
      <SavePanel />
    </aside>
  );
};

export default SidebarLeft;
