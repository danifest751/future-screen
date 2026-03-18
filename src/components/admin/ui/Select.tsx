import { forwardRef, type SelectHTMLAttributes } from 'react';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { hasError, className = '', ...props },
  ref
) {
  return (
    <select
      ref={ref}
      {...props}
      className={[
        'w-full rounded-lg border px-3 py-2',
        'bg-white/5 text-white placeholder:text-slate-500',
        'border-white/10 focus:border-brand-500 focus:outline-none',
        hasError ? 'border-red-500/50' : '',
        'disabled:opacity-60',
        className,
      ].join(' ')}
    />
  );
});

export default Select;

