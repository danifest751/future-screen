import { forwardRef, type TextareaHTMLAttributes } from 'react';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
  /** Описание поля для скринридеров */
  description?: string;
};

/**
 * Доступный Textarea с поддержкой ARIA-атрибутов.
 * Используйте вместе с компонентом Field для полной доступности.
 *
 * @example
 * <Field label="Описание" hint="Максимум 500 символов">
 *   <Textarea rows={4} placeholder="Введите описание..." />
 * </Field>
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { hasError, className = '', description, 'aria-describedby': ariaDescribedBy, ...props },
  ref
) {
  const ariaInvalid = hasError ? true : props['aria-invalid'];
  const finalAriaDescribedBy = description
    ? `${ariaDescribedBy || ''} ${props.id}-desc`.trim()
    : ariaDescribedBy;

  return (
    <>
      <textarea
        ref={ref}
        {...props}
        aria-invalid={ariaInvalid}
        aria-describedby={finalAriaDescribedBy || undefined}
        className={[
          'w-full rounded-lg border px-3 py-2',
          'bg-white/5 text-white placeholder:text-slate-500',
          'border-white/10 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
          'transition-colors resize-y min-h-[80px]',
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

export default Textarea;
