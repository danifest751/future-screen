import { useEffect, useRef, useCallback } from 'react';

export type UseFocusTrapOptions = {
  /** Флаг активности ловушки фокуса */
  active: boolean;
  /** Элемент, на который вернётся фокус после закрытия */
  returnFocusTo?: HTMLElement | null;
  /** Коллбэк при нажатии Escape */
  onEscape?: () => void;
};

export type UseFocusTrapReturn = {
  /** ref для контейнера модалки/диалога */
  containerRef: React.RefObject<HTMLElement>;
};

/**
 * Хук для реализации ловушки фокуса в модальных окнах.
 * Гарантирует, что фокус остаётся внутри контейнера при Tab/Shift+Tab.
 *
 * @example
 * function Modal({ open, onClose }) {
 *   const { containerRef } = useFocusTrap({
 *     active: open,
 *     onEscape: onClose
 *   });
 *
 *   return open ? (
 *     <div ref={containerRef as React.RefObject<HTMLDivElement>}>
 *       <button>First</button>
 *       <button>Last</button>
 *     </div>
 *   ) : null;
 * }
 */
export function useFocusTrap({ active, returnFocusTo, onEscape }: UseFocusTrapOptions): UseFocusTrapReturn {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Сохраняем предыдущий активный элемент
  useEffect(() => {
    if (active) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [active]);

  // Возвращаем фокус при деактивации
  useEffect(() => {
    return () => {
      if (!active) {
        const elementToFocus = returnFocusTo || previousActiveElement.current;
        elementToFocus?.focus();
      }
    };
  }, [active, returnFocusTo]);

  // Устанавливаем начальный фокус
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;

    // Ищем первый фокусируемый элемент
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];

    if (firstElement) {
      // Небольшая задержка для анимации открытия
      const timer = setTimeout(() => {
        firstElement.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [active]);

  // Обработка Tab и Escape
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!active || !containerRef.current) return;

      const container = containerRef.current;
      const focusableElements = getFocusableElements(container);

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Обработка Escape
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      // Обработка Tab
      if (event.key !== 'Tab') return;

      // Если Shift + Tab на первом элементе → переходим на последний
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      // Если Tab на последнем элементе → переходим на первый
      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        return;
      }
    },
    [active, onEscape]
  );

  useEffect(() => {
    if (!active) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, handleKeyDown]);

  return { containerRef };
}

/**
 * Получает все фокусируемые элементы внутри контейнера.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  const elements = Array.from(container.querySelectorAll<HTMLElement>(selectors));

  // Фильтруем невидимые элементы
  return elements.filter((el) => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

export default useFocusTrap;
