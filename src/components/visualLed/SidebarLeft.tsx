import { useVisualLed } from './state/VisualLedContext';
import CabinetPanel from './panels/CabinetPanel';
import FloorPlanScreensPanel from './panels/FloorPlanScreensPanel';
import PlacementPanel from './panels/PlacementPanel';
import ReportPanel from './panels/ReportPanel';
import SavePanel from './panels/SavePanel';
import ScalePanel from './panels/ScalePanel';
import ScreensPanel from './panels/ScreensPanel';
import SelectionPanel from './panels/SelectionPanel';
import VenuePanel from './panels/VenuePanel';

interface SidebarLeftProps {
  className?: string;
}

const SidebarLeft = ({ className = '' }: SidebarLeftProps) => {
  const { state } = useVisualLed();
  const isVisualizer = state.ui.viewMode === 'visualizer';

  return (
    <aside className={`flex w-full flex-col gap-2 lg:w-72 ${className}`.trim()}>
      {isVisualizer ? (
        <>
          <ScalePanel />
          <ScreensPanel />
          <SelectionPanel />
          <CabinetPanel />
          <ReportPanel />
          <SavePanel />
        </>
      ) : (
        <>
          <VenuePanel />
          <FloorPlanScreensPanel />
          <PlacementPanel />
          <SavePanel />
        </>
      )}
    </aside>
  );
};

export default SidebarLeft;
