import CabinetPanel from './panels/CabinetPanel';
import ReportPanel from './panels/ReportPanel';
import SavePanel from './panels/SavePanel';
import ScalePanel from './panels/ScalePanel';
import ScreensPanel from './panels/ScreensPanel';
import SelectionPanel from './panels/SelectionPanel';

interface SidebarLeftProps {
  className?: string;
}

const SidebarLeft = ({ className = '' }: SidebarLeftProps) => {
  return (
    <aside className={`flex w-full flex-col gap-2 lg:w-72 ${className}`.trim()}>
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
