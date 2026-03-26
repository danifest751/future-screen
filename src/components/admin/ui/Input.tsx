import { forwardRef, type InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
  /** Описание поля для скринридеров (переопределяет aria-describedby) */
  description?: string;
};

/**
 * Доступный Input с поддержкой ARIA-атрибутов.
 * Используйте вместе с компонентом Field для полной доступности.
 *
 * @example
 * <Field label="Email" required>
 *   <Input type="email" placeholder="your@email.com" />
 * </Field>
 */
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { hasError, className = '', description, 'aria-describedby': ariaDescribedBy, ...props },
  ref
) {
  // Определяем aria-invalid на основе hasError
  const ariaInvalid = hasError ? true : props['aria-invalid'];

  // Комбинируем aria-describedby из props и description
  const finalAriaDescribedBy = description
    ? `${ariaDescribedBy || ''} ${props.id}-desc`.trim()
    : ariaDescribedBy;

  return (
    <>
      <input
        ref={ref}
        {...props}
        aria-invalid={ariaInvalid}
        aria-describedby={finalAriaDescribedBy || undefined}
        className={[
          'w-full rounded-lg border px-3 py-2',
          'bg-white/5 text-white placeholder:text-slate-500',
          'border-white/10 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
          'transition-colors',
          hasError ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : '',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          className,
        ].join(' ')}
      />
      {description && (
        <span id={`${props.id}-desc`} className="sr-only">
          {description}
        </span>
      )}
    </>
  );
});

export default Input;
