import { forwardRef, type InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
  /** Screen-reader description for aria-describedby. */
  description?: string;
};

/**
 * Accessible admin input with ARIA support. Use with Field when visible
 * labels, helper text, and validation text are needed.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { hasError, className = '', description, 'aria-describedby': ariaDescribedBy, ...props },
  ref
) {
  const ariaInvalid = hasError ? true : props['aria-invalid'];
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
          'border-white/10 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400',
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
