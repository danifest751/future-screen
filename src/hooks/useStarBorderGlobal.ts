import { useEffect } from 'react';
import { useSiteSettingsContext } from '../context/SiteSettingsContext';

/**
 * Глобальный хук для автоматического применения Star Border к интерактивным элементам.
 * Добавляет класс star-border-container к кнопкам, ссылкам, карточкам и другим hover-элементам.
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

    // Устанавливаем CSS переменные
    document.documentElement.style.setProperty('--star-border-color', color);
    document.documentElement.style.setProperty('--star-border-speed', `${speed}s`);
    document.documentElement.style.setProperty('--star-border-thickness', `${thickness}px`);
    document.documentElement.style.setProperty('--star-border-intensity', String(intensity));
    document.documentElement.style.setProperty('--star-border-corner-offset', `${cornerOffset}px`);

    const STAR_BORDER_CLASSES = ['star-border-container', 'star-border-button', 'star-border-link', 'star-border-card'];

    const clearStarBorderClasses = () => {
      STAR_BORDER_CLASSES.forEach((className) => {
        document.querySelectorAll(`.${className}`).forEach((el) => {
          el.classList.remove(className);
        });
      });
    };

    if (!isEnabled) {
      clearStarBorderClasses();
      return;
    }

    // Селекторы для разных типов элементов
    const selectors = {
      button: 'button:not(.star-border-ignore):not(.star-border-container *), [role="button"]:not(.star-border-ignore):not(.star-border-container *)',
      link: 'a:not(.star-border-ignore):not([href^="#"]):not(.star-border-container *)',
      card: '.card:not(.star-border-ignore):not(.star-border-container *)',
    };

    // Применяем классы к элементам без изменения структуры DOM
    const applyStarBorder = () => {
      document.querySelectorAll(selectors.button).forEach((el) => {
        const element = el as HTMLElement;
        element.classList.add('star-border-container', 'star-border-button');
      });

      document.querySelectorAll(selectors.link).forEach((el) => {
        const element = el as HTMLElement;
        if (element.textContent?.trim()) {
          element.classList.add('star-border-container', 'star-border-link');
        }
      });

      document.querySelectorAll(selectors.card).forEach((el) => {
        const element = el as HTMLElement;
        element.classList.add('star-border-container', 'star-border-card');
      });
    };

    // Применяем сразу
    applyStarBorder();

    // Наблюдаем за изменениями DOM
    const observer = new MutationObserver((mutations) => {
      let shouldApply = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldApply = true;
          break;
        }
      }
      if (shouldApply) {
        applyStarBorder();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      if (!isEnabled) {
        clearStarBorderClasses();
      }
    };
  }, [settings.starBorder?.enabled, settings.starBorder?.color, settings.starBorder?.speed, settings.starBorder?.thickness, settings.starBorder?.intensity, settings.starBorder?.cornerOffset]);
};

export default useStarBorderGlobal;
