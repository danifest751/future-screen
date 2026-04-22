import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BeforeUnloadGuard from '../components/visualLed/BeforeUnloadGuard';
import CanvasStage from '../components/visualLed/CanvasStage';
import ShortcutsModal from '../components/visualLed/ShortcutsModal';
import SidebarLeft from '../components/visualLed/SidebarLeft';
import SidebarRight from '../components/visualLed/SidebarRight';
import StageHeader from '../components/visualLed/StageHeader';
import VideoPool from '../components/visualLed/VideoPool';
import WorkflowSteps from '../components/visualLed/WorkflowSteps';
import { VisualLedProvider } from '../components/visualLed/state/VisualLedContext';

/**
 * New React-based Visual LED planner at /visual-led/v2. Parallel to
 * the legacy HTML at /visual-led; the React version ships features
 * phase-by-phase.
 */
const VisualLedV2Page = () => {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

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
            beta · phase 5
          </span>
        </div>
        <div className="grid gap-2 lg:grid-cols-[18rem_1fr_16rem]">
          <SidebarLeft />
          <main className="flex min-h-[70vh] flex-col gap-2">
            <StageHeader onOpenShortcuts={() => setShortcutsOpen(true)} />
            <WorkflowSteps />
            <CanvasStage />
          </main>
          <SidebarRight />
        </div>
        <VideoPool />
        <BeforeUnloadGuard />
        <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      </div>
    </VisualLedProvider>
  );
};

export default VisualLedV2Page;
