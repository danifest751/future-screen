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
    const color = settings.starBorder?.color ?? '#667eea';
    const speed = settings.starBorder?.speed ?? 6;
    const thickness = settings.starBorder?.thickness ?? 2;
    const intensity = settings.starBorder?.intensity ?? 1;

    // Устанавливаем CSS переменные
    document.documentElement.style.setProperty('--star-border-color', color);
    document.documentElement.style.setProperty('--star-border-speed', `${speed}s`);
    document.documentElement.style.setProperty('--star-border-thickness', `${thickness}px`);
    document.documentElement.style.setProperty('--star-border-intensity', String(intensity));

    if (!isEnabled) {
      // Удаляем все классы star-border если функция отключена
      document.querySelectorAll('.star-border-container').forEach((el) => {
        const inner = el.querySelector('.inner-content');
        if (inner && inner.firstElementChild) {
          // Восстанавливаем оригинальный элемент
          el.replaceWith(inner.firstElementChild);
        }
      });
      return;
    }

    // Селекторы для разных типов элементов
    const selectors = {
      button: 'button:not(.star-border-ignore):not(.star-border-container *), [role="button"]:not(.star-border-ignore):not(.star-border-container *)',
      link: 'a:not(.star-border-ignore):not([href^="#"]):not(.star-border-container *)',
      card: '.card:not(.star-border-ignore):not(.star-border-container *)',
    };

    // Применяем классы к элементам
    const applyStarBorder = () => {
      // Кнопки
      document.querySelectorAll(selectors.button).forEach((el) => {
        if (!el.closest('.star-border-container')) {
          wrapWithStarBorder(el as HTMLElement, 'star-border-button');
        }
      });

      // Ссылки
      document.querySelectorAll(selectors.link).forEach((el) => {
        if (!el.closest('.star-border-container') && el.textContent?.trim()) {
          wrapWithStarBorder(el as HTMLElement, 'star-border-link');
        }
      });

      // Карточки
      document.querySelectorAll(selectors.card).forEach((el) => {
        if (!el.closest('.star-border-container')) {
          wrapWithStarBorder(el as HTMLElement, 'star-border-card');
        }
      });
    };

    const wrapWithStarBorder = (element: HTMLElement, variantClass: string) => {
      const wrapper = document.createElement('div');
      wrapper.className = `star-border-container ${variantClass}`;

      const inner = document.createElement('div');
      inner.className = 'inner-content';

      // Клонируем элемент во внутренний контейнер
      inner.appendChild(element.cloneNode(true));

      wrapper.appendChild(inner);

      element.replaceWith(wrapper);
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
  }, [settings.starBorder?.enabled, settings.starBorder?.color, settings.starBorder?.speed, settings.starBorder?.thickness, settings.starBorder?.intensity]);
};

export default useStarBorderGlobal;
