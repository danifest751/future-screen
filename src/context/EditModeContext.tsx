import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Inline visual edit mode — admin-only overlay that marks DB-backed content
 * blocks as editable and saves on blur.
 */

type EditModeContextValue = {
  isEditing: boolean;
  toggle: () => void;
  setEditing: (next: boolean) => void;
  /** Incremented on each successful save — signals listeners to refetch. */
  savesVersion: number;
  reportSaveSucceeded: () => void;
  /** Number of in-flight saves — used for beforeunload guard. */
  activeSaves: number;
  reportSaveStart: () => void;
  reportSaveEnd: () => void;
};

const EditModeContext = createContext<EditModeContextValue | null>(null);

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [savesVersion, setSavesVersion] = useState(0);
  const [activeSaves, setActiveSaves] = useState(0);

  const toggle = useCallback(() => setIsEditing((prev) => !prev), []);
  const setEditing = useCallback((next: boolean) => setIsEditing(next), []);
  const reportSaveSucceeded = useCallback(
    () => setSavesVersion((prev) => prev + 1),
    [],
  );
  const reportSaveStart = useCallback(() => setActiveSaves((n) => n + 1), []);
  const reportSaveEnd = useCallback(() => setActiveSaves((n) => Math.max(0, n - 1)), []);

  // Body attribute lets non-provider CSS scope edit-mode-only styles.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isEditing) {
      document.body.setAttribute('data-edit-mode', 'on');
    } else {
      document.body.removeAttribute('data-edit-mode');
    }
    return () => {
      document.body.removeAttribute('data-edit-mode');
    };
  }, [isEditing]);

  // beforeunload guard while a save is in flight.
  useEffect(() => {
    if (activeSaves === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [activeSaves]);

  const value = useMemo<EditModeContextValue>(
    () => ({
      isEditing,
      toggle,
      setEditing,
      savesVersion,
      reportSaveSucceeded,
      activeSaves,
      reportSaveStart,
      reportSaveEnd,
    }),
    [
      isEditing,
      toggle,
      setEditing,
      savesVersion,
      reportSaveSucceeded,
      activeSaves,
      reportSaveStart,
      reportSaveEnd,
    ],
  );

  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useEditMode = (): EditModeContextValue => {
  const ctx = useContext(EditModeContext);
  if (!ctx) {
    throw new Error('useEditMode must be used within EditModeProvider');
  }
  return ctx;
};

/**
 * Non-throwing variant for components that render outside the provider
 * (e.g. public pages before provider mounts in tests). Returns inert value.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useOptionalEditMode = (): EditModeContextValue => {
  const ctx = useContext(EditModeContext);
  if (!ctx) {
    return {
      isEditing: false,
      toggle: () => {},
      setEditing: () => {},
      savesVersion: 0,
      reportSaveSucceeded: () => {},
      activeSaves: 0,
      reportSaveStart: () => {},
      reportSaveEnd: () => {},
    };
  }
  return ctx;
};
