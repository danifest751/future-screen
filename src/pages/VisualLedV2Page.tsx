import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Archive, Home } from 'lucide-react';
import BeforeUnloadGuard from '../components/visualLed/BeforeUnloadGuard';
import CanvasStage from '../components/visualLed/CanvasStage';
import ProjectLoader from '../components/visualLed/ProjectLoader';
import ShortcutsModal from '../components/visualLed/ShortcutsModal';
import SidebarLeft from '../components/visualLed/SidebarLeft';
import SidebarRight from '../components/visualLed/SidebarRight';
import StageHeader from '../components/visualLed/StageHeader';
import VideoPool from '../components/visualLed/VideoPool';
import WorkflowSteps from '../components/visualLed/WorkflowSteps';
import { VisualLedProvider } from '../components/visualLed/state/VisualLedContext';

/**
 * React-based Visual LED planner. Primary entry point at /visual-led
 * (with /visual-led/v2 kept as alias for old share links). The legacy
 * vanilla-HTML version lives at /visual-led/legacy as a rollback path
 * during the observation period.
 */
const VisualLedV2Page = () => {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <VisualLedProvider>
      <Helmet>
        <title>Visual LED · Perspective Planner</title>
      </Helmet>
      {/*
        Scoped focus-visible ring so keyboard navigation is visible.
        Confined to [data-vled-root] so the rest of the site's styles
        stay untouched.
      */}
      <style>{`
        [data-vled-root="true"] button:focus-visible,
        [data-vled-root="true"] input:focus-visible,
        [data-vled-root="true"] select:focus-visible,
        [data-vled-root="true"] textarea:focus-visible,
        [data-vled-root="true"] a:focus-visible {
          outline: 2px solid rgb(96 165 250);
          outline-offset: 2px;
          border-radius: 0.375rem;
        }
      `}</style>
      <div
        data-vled-root="true"
        className="min-h-screen bg-slate-950 p-2 text-slate-200"
      >
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-900/40 px-2 py-1 text-slate-300 hover:border-white/30 hover:text-white"
          >
            <Home className="h-3 w-3" />
            На сайт
          </Link>
          <Link
            to="/visual-led/legacy"
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-900/40 px-2 py-1 text-slate-500 hover:border-white/30 hover:text-white"
            title="Старая версия визуализатора (временно доступна)"
          >
            <Archive className="h-3 w-3" />
            Legacy
          </Link>
        </div>
        <ProjectLoader />
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
