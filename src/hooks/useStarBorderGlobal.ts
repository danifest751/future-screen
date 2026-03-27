import { useEffect } from 'react';
import { useSiteSettingsContext } from '../context/SiteSettingsContext';

/**
 * Глобальный хук для автоматического применения Star Border к интерактивным элементам.
 * Добавляет класс star-border к кнопкам, ссылкам, карточкам и другим hover-элементам.
 */
export const useStarBorderGlobal = () => {
  const { settings } = useSiteSettingsContext();

  useEffect(() => {
    if (!settings.starBorderEnabled) {
      // Удаляем все классы star-border если функция отключена
      document.querySelectorAll('.star-border').forEach((el) => {
        el.classList.remove('star-border', 'star-border-button', 'star-border-card', 'star-border-link', 'star-border-input');
      });
      return;
    }

    // Селекторы для разных типов элементов
    const selectors = {
      button: 'button:not(.star-border-ignore), [role="button"]:not(.star-border-ignore)',
      link: 'a:not(.star-border-ignore):not([href^="#"])',
      card: '.card:not(.star-border-ignore), [class*="card"]:not(.star-border-ignore)',
      input: 'input:not(.star-border-ignore), textarea:not(.star-border-ignore), select:not(.star-border-ignore)',
    };

    // Применяем классы к элементам
    const applyStarBorder = () => {
      // Кнопки
      document.querySelectorAll(selectors.button).forEach((el) => {
        if (!el.closest('.star-border')) {
          el.classList.add('star-border', 'star-border-button');
        }
      });

      // Ссылки
      document.querySelectorAll(selectors.link).forEach((el) => {
        if (!el.closest('.star-border') && el.textContent?.trim()) {
          el.classList.add('star-border', 'star-border-link');
        }
      });

      // Карточки
      document.querySelectorAll(selectors.card).forEach((el) => {
        if (!el.closest('.star-border')) {
          el.classList.add('star-border', 'star-border-card');
        }
      });

      // Инпуты
      document.querySelectorAll(selectors.input).forEach((el) => {
        if (!el.closest('.star-border')) {
          el.classList.add('star-border', 'star-border-input');
        }
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
    };
  }, [settings.starBorderEnabled]);
};

export default useStarBorderGlobal;
