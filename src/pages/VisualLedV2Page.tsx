import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { Home } from 'lucide-react';
import BeforeUnloadGuard from '../components/visualLed/BeforeUnloadGuard';
import CanvasStage from '../components/visualLed/CanvasStage';
import MobileSidebarTabs from '../components/visualLed/MobileSidebarTabs';
import PresetPicker from '../components/visualLed/PresetPicker';
import PriceHeader from '../components/visualLed/PriceHeader';
import ProjectLoader from '../components/visualLed/ProjectLoader';
import QuoteRequestModal from '../components/visualLed/QuoteRequestModal';
import SceneMetricsBar from '../components/visualLed/SceneMetricsBar';
import ShortcutsModal from '../components/visualLed/ShortcutsModal';
import SidebarLeft from '../components/visualLed/SidebarLeft';
import SidebarRight from '../components/visualLed/SidebarRight';
import StageHeader from '../components/visualLed/StageHeader';
import VideoPool from '../components/visualLed/VideoPool';
import WorkflowSteps from '../components/visualLed/WorkflowSteps';
import { isOnboardingMode } from '../components/visualLed/state/selectors';
import { useVisualLed, VisualLedProvider } from '../components/visualLed/state/VisualLedContext';

/**
 * Sales-configurator gate. Picks between the PresetPicker onboarding
 * screen and the full editing shell based on isOnboardingMode().
 * Lives inside VisualLedProvider so it can read state.
 */
const VisualLedShell = () => {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const { state } = useVisualLed();
  const [searchParams] = useSearchParams();
  const hasUrlProject = Boolean(searchParams.get('project'));
  const onboarding = isOnboardingMode(state, hasUrlProject);

  if (onboarding) {
    return (
      <>
        <ProjectLoader />
        <PresetPicker />
        <BeforeUnloadGuard />
      </>
    );
  }

  return (
    <>
      <ProjectLoader />
      <PriceHeader onRequestQuote={() => setQuoteOpen(true)} />
      {/*
        Layout breakpoints:
          <md  (phone):  flex-col stack — main first, SidebarRight (Фоны/Видео) below.
                          SidebarLeft hidden, accessible via MobileSidebarTabs (bottom drawer).
          md..<lg (tablet portrait): 2-col grid [main | SidebarRight].
                          SidebarLeft still hidden + drawer.
          lg+ (desktop): 3-col grid [SidebarLeft | main | SidebarRight] — original.
      */}
      <div className="flex flex-col gap-2 pb-14 md:grid md:grid-cols-[1fr_16rem] lg:grid-cols-[18rem_1fr_16rem] lg:pb-0">
        <SidebarLeft className="hidden lg:flex" />
        <main className="flex min-h-[70vh] flex-col gap-2">
          <StageHeader onOpenShortcuts={() => setShortcutsOpen(true)} />
          <WorkflowSteps />
          <SceneMetricsBar />
          <CanvasStage />
        </main>
        <SidebarRight />
      </div>
      <MobileSidebarTabs />
      <VideoPool />
      <BeforeUnloadGuard />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
};

/**
 * React-based Visual LED planner. Primary entry point at /visual-led
 * (with /visual-led/v2 kept as alias for old share links). The legacy
 * vanilla-HTML version lives at /visual-led/legacy as a rollback path
 * during the observation period.
 */
const VisualLedV2Page = () => {
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
          outline: 2px solid var(--brand-400);
          outline-offset: 2px;
          border-radius: 0.375rem;
        }
      `}</style>
      <div
        data-vled-root="true"
        className="min-h-[100dvh] bg-slate-950 p-2 text-slate-200"
      >
        <div className="mb-2 flex items-center text-xs text-slate-400">
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-900/40 px-2 py-1 text-slate-300 hover:border-white/30 hover:text-white"
          >
            <Home className="h-3 w-3" />
            На сайт
          </Link>
        </div>
        <VisualLedShell />
      </div>
    </VisualLedProvider>
  );
};

export default VisualLedV2Page;
