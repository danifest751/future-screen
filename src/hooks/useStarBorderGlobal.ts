import { useEffect } from 'react';
import { useSiteSettingsContext } from '../context/SiteSettingsContext';

const STAR_BORDER_CLASSES = ['star-border-container', 'star-border-button', 'star-border-link', 'star-border-card'];

const SELECTORS = {
  button:
    'button:not(.star-border-ignore):not(.star-border-container *), [role="button"]:not(.star-border-ignore):not(.star-border-container *)',
  link: 'a:not(.star-border-ignore):not([href^="#"]):not(.star-border-container *)',
  card: '.card:not(.star-border-ignore):not(.star-border-container *)',
};

const clearStarBorderClasses = () => {
  STAR_BORDER_CLASSES.forEach((className) => {
    document.querySelectorAll(`.${className}`).forEach((el) => {
      el.classList.remove(className);
    });
  });
};

const applyStarBorder = (scope: ParentNode) => {
  scope.querySelectorAll(SELECTORS.button).forEach((el) => {
    const element = el as HTMLElement;
    element.classList.add('star-border-container', 'star-border-button');
  });

  scope.querySelectorAll(SELECTORS.link).forEach((el) => {
    const element = el as HTMLElement;
    if (element.textContent?.trim()) {
      element.classList.add('star-border-container', 'star-border-link');
    }
  });

  scope.querySelectorAll(SELECTORS.card).forEach((el) => {
    const element = el as HTMLElement;
    element.classList.add('star-border-container', 'star-border-card');
  });
};

/**
 * Applies Star Border classes globally to interactive elements.
 * Uses rAF-batched mutation handling to avoid re-running heavy selectors
 * for every single DOM mutation burst.
 */
export const useStarBorderGlobal = () => {
  const { settings } = useSiteSettingsContext();

  useEffect(() => {
    const isEnabled = settings.starBorder?.enabled ?? false;
    const color = settings.starBorder?.color ?? '#8aa2ff';
    const speed = settings.starBorder?.speed ?? 6;
    const thickness = settings.starBorder?.thickness ?? 2.5;
    const intensity = settings.starBorder?.intensity ?? 1;
    const cornerOffset = settings.starBorder?.cornerOffset ?? 0;

    document.documentElement.style.setProperty('--star-border-color', color);
    document.documentElement.style.setProperty('--star-border-speed', `${speed}s`);
    document.documentElement.style.setProperty('--star-border-thickness', `${thickness}px`);
    document.documentElement.style.setProperty('--star-border-intensity', String(intensity));
    document.documentElement.style.setProperty('--star-border-corner-offset', `${cornerOffset}px`);

    if (!isEnabled) {
      clearStarBorderClasses();
      return;
    }

    const root = document.getElementById('root') ?? document.body;
    let rafId: number | null = null;

    const scheduleApply = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        applyStarBorder(root);
      });
    };

    scheduleApply();

    const observer = new MutationObserver((mutations) => {
      let shouldApply = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldApply = true;
          break;
        }
        if (mutation.type === 'attributes') {
          shouldApply = true;
          break;
        }
      }
      if (shouldApply) {
        scheduleApply();
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'href', 'role'],
    });

    return () => {
      observer.disconnect();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [
    settings.starBorder?.enabled,
    settings.starBorder?.color,
    settings.starBorder?.speed,
    settings.starBorder?.thickness,
    settings.starBorder?.intensity,
    settings.starBorder?.cornerOffset,
  ]);
};

export default useStarBorderGlobal;
