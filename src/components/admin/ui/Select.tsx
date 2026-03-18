import { type SelectHTMLAttributes } from 'react';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

export default function Select({ hasError, className = '', ...props }: SelectProps) {
  return (
    <select
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
}

