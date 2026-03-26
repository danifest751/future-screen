import { forwardRef, type SelectHTMLAttributes } from 'react';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
  /** Описание поля для скринридеров */
  description?: string;
};

/**
 * Доступный Select с поддержкой ARIA-атрибутов.
 * Используйте вместе с компонентом Field для полной доступности.
 *
 * @example
 * <Field label="Категория" required>
 *   <Select>
 *     <option value="">Выберите...</option>
 *     <option value="1">Опция 1</option>
 *   </Select>
 * </Field>
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { hasError, className = '', description, 'aria-describedby': ariaDescribedBy, children, ...props },
  ref
) {
  const ariaInvalid = hasError ? true : props['aria-invalid'];
  const finalAriaDescribedBy = description
    ? `${ariaDescribedBy || ''} ${props.id}-desc`.trim()
    : ariaDescribedBy;

  return (
    <>
      <select
        ref={ref}
        {...props}
        aria-invalid={ariaInvalid}
        aria-describedby={finalAriaDescribedBy || undefined}
        className={[
          'w-full rounded-lg border px-3 py-2',
          'bg-white/5 text-white',
          'border-white/10 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
          'transition-colors appearance-none',
          'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")]',
          'bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10',
          hasError ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : '',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          className,
        ].join(' ')}
      >
        {children}
      </select>
      {description && (
        <span id={`${props.id}-desc`} className="sr-only">
          {description}
        </span>
      )}
    </>
  );
});

export default Select;
