import { forwardRef, type TextareaHTMLAttributes } from 'react';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { hasError, className = '', ...props },
  ref
) {
  return (
    <textarea
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

export default Textarea;

