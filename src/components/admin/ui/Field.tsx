import { type ReactNode } from 'react';

export type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  required?: boolean;
};

export default function Field({ label, hint, error, children, required }: FieldProps) {
  return (
    <div className="space-y-1">
      {label ? (
        <div className="text-sm text-slate-200">
          {label}
          {required ? <span className="ml-1 text-red-300">*</span> : null}
        </div>
      ) : null}
      {children}
      {hint ? <div className="text-xs text-slate-400">{hint}</div> : null}
      {error ? (
        <div className="mt-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-300">
          {error}
        </div>
      ) : null}
    </div>
  );
}

