import { useEffect, useLayoutEffect } from 'react';

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

  useLayoutEffect(() => {
    if (!hasUnsavedChanges || typeof document === 'undefined') return undefined;

    const handleClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest('a[href]');
      if (!link || link.hasAttribute('download')) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      const nextUrl = new URL(link.getAttribute('href') ?? '', window.location.href);
      if (nextUrl.origin !== window.location.origin) return;
      if (
        nextUrl.pathname === window.location.pathname &&
        nextUrl.search === window.location.search &&
        nextUrl.hash === window.location.hash
      ) {
        return;
      }

      const shouldProceed = window.confirm('Есть несохраненные изменения. Уйти со страницы?');
      if (!shouldProceed) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('click', handleClickCapture, true);
    return () => {
      document.removeEventListener('click', handleClickCapture, true);
    };
  }, [hasUnsavedChanges]);
};
