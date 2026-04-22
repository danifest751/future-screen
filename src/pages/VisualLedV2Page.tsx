import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CanvasStage from '../components/visualLed/CanvasStage';
import SidebarLeft from '../components/visualLed/SidebarLeft';
import SidebarRight from '../components/visualLed/SidebarRight';
import StageHeader from '../components/visualLed/StageHeader';
import VideoPool from '../components/visualLed/VideoPool';
import { VisualLedProvider } from '../components/visualLed/state/VisualLedContext';

/**
 * New React-based Visual LED planner — parallel route at /visual-led/v2
 * while the legacy HTML at /visual-led stays the canonical entry
 * point. Phase 2 delivers the layout shell + state foundation + scene
 * tabs. Real editing features (place screens, scale calibration,
 * cabinet planner, assist, export) land in phase 3+.
 */
const VisualLedV2Page = () => {
  return (
    <VisualLedProvider>
      <Helmet>
        <title>Visual LED · v2 (beta)</title>
      </Helmet>
      <div className="min-h-screen bg-slate-950 p-2 text-slate-200">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <Link
            to="/visual-led"
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-900/40 px-2 py-1 text-slate-300 hover:border-white/30 hover:text-white"
          >
            <ArrowLeft className="h-3 w-3" />
            Legacy visualizer
          </Link>
          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-200">
            beta · phase 4
          </span>
        </div>
        <div className="grid gap-2 lg:grid-cols-[18rem_1fr_16rem]">
          <SidebarLeft />
          <main className="flex min-h-[70vh] flex-col gap-2">
            <StageHeader />
            <CanvasStage />
          </main>
          <SidebarRight />
        </div>
        <VideoPool />
      </div>
    </VisualLedProvider>
  );
};

export default VisualLedV2Page;
