import { useEffect } from 'react';
import { useVisualLed } from './state/VisualLedContext';

/**
 * Prompt "are you sure?" on tab close / hard refresh when the state
 * is not empty. Cheap check: any scene has elements OR any
 * backgrounds/videos are uploaded. Autosave covers crash cases, but a
 * user closing the tab mid-session still benefits from the prompt.
 */
const BeforeUnloadGuard = () => {
  const { state } = useVisualLed();

  useEffect(() => {
    const hasWork =
      state.scenes.some(
        (scene) => scene.elements.length > 0 || scene.backgrounds.length > 0,
      ) || state.videos.length > 0;
    if (!hasWork) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Chrome spec — any non-empty string triggers prompt.
      return '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [state]);

  return null;
};

export default BeforeUnloadGuard;
