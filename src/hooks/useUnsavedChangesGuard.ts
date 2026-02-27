import { useContext, useEffect } from 'react';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';

type Transition = {
  retry(): void;
};

const useRouteBlocker = (blocker: (tx: Transition) => void, when = true) => {
  const { navigator } = useContext(NavigationContext) as unknown as {
    navigator: { block: (cb: (tx: Transition) => void) => () => void };
  };

  useEffect(() => {
    if (!when || typeof navigator.block !== 'function') return undefined;

    const unblock = navigator.block((tx) => {
      const autoUnblockingTx: Transition = {
        ...tx,
        retry() {
          unblock();
          tx.retry();
        },
      };
      blocker(autoUnblockingTx);
    });

    return unblock;
  }, [navigator, blocker, when]);
};

export const useUnsavedChangesGuard = (hasUnsavedChanges: boolean) => {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useRouteBlocker((tx) => {
    const shouldProceed = window.confirm('Есть несохраненные изменения. Уйти со страницы?');
    if (shouldProceed) {
      tx.retry();
    }
  }, hasUnsavedChanges);
};
