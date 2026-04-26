import { createContext, useContext, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ContextValue {
  /**
   * When true, every nested CollapsiblePanel renders as always-open
   * without the toggle UI. Used by the mobile bottom drawer where the
   * drawer header already shows the panel title — having a second
   * collapsible header inside would be redundant.
   */
  alwaysOpen: boolean;
}

const CollapsiblePanelContext = createContext<ContextValue>({ alwaysOpen: false });

interface AlwaysOpenProps {
  children: ReactNode;
}

/**
 * Wrap a subtree to force every CollapsiblePanel inside to render as
 * always-open without chrome. Used by `MobileSidebarTabs`.
 */
export const CollapsiblePanelAlwaysOpen = ({ children }: AlwaysOpenProps) => (
  <CollapsiblePanelContext.Provider value={{ alwaysOpen: true }}>
    {children}
  </CollapsiblePanelContext.Provider>
);

interface PanelProps {
  /** Stable identifier — used as the localStorage key suffix. */
  id: string;
  /** Header text shown in the toggle. */
  title: string;
  /** Icon shown next to the title. Pass a sized lucide-react icon. */
  icon: ReactNode;
  /** First-time default. After the user toggles once, localStorage wins. */
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * Card-style panel with a collapse/expand toggle. Open/closed state
 * persists in localStorage under `vled-panel:{id}` so it survives
 * reloads. Inside `CollapsiblePanelAlwaysOpen`, behaves as a plain
 * always-open container without the toggle.
 */
const CollapsiblePanel = ({ id, title, icon, defaultOpen = true, children }: PanelProps) => {
  const { alwaysOpen } = useContext(CollapsiblePanelContext);
  const storageKey = `vled-panel:${id}`;

  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return defaultOpen;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === 'open') return true;
      if (saved === 'closed') return false;
    } catch {
      /* localStorage unavailable */
    }
    return defaultOpen;
  });

  if (alwaysOpen) {
    return <div className="px-1 pb-1">{children}</div>;
  }

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem(storageKey, next ? 'open' : 'closed');
    } catch {
      /* localStorage unavailable */
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-1.5 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-white"
        aria-expanded={open}
        aria-controls={`${storageKey}-content`}
      >
        {icon}
        <span className="flex-1 text-left">{title}</span>
        {open ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>
      {open ? (
        <div id={`${storageKey}-content`} className="px-3 pb-3">
          {children}
        </div>
      ) : null}
    </div>
  );
};

export default CollapsiblePanel;
