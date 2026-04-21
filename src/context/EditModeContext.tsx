import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Inline visual edit mode — admin-only overlay that marks DB-backed content
 * blocks as editable and saves on blur.
 *
 * Phase 1 scope:
 *   - plain-text fields only
 *   - auto-save on blur (no "Save all" batch yet)
 *   - locale switcher controls live `siteLocale` from I18nContext
 *
 * Future (Phase 2): pending-changes map, batch save, dirty-exit guard,
 * markdown + image kinds.
 */

type EditModeContextValue = {
  isEditing: boolean;
  toggle: () => void;
  setEditing: (next: boolean) => void;
  /**
   * Incremented each time a save succeeds — lets sibling components
   * trigger refetches/invalidations without a coupling back to the writer.
   */
  savesVersion: number;
  reportSaveSucceeded: () => void;
};

const EditModeContext = createContext<EditModeContextValue | null>(null);

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [savesVersion, setSavesVersion] = useState(0);

  const toggle = useCallback(() => setIsEditing((prev) => !prev), []);
  const setEditing = useCallback((next: boolean) => setIsEditing(next), []);
  const reportSaveSucceeded = useCallback(
    () => setSavesVersion((prev) => prev + 1),
    [],
  );

  const value = useMemo<EditModeContextValue>(
    () => ({ isEditing, toggle, setEditing, savesVersion, reportSaveSucceeded }),
    [isEditing, toggle, setEditing, savesVersion, reportSaveSucceeded],
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
    };
  }
  return ctx;
};
