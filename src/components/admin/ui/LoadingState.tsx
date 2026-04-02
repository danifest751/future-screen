import { memo, type ReactNode } from 'react';

export type LoadingStateProps = {
  title?: ReactNode;
  description?: ReactNode;
};

const LoadingState = memo(function LoadingState({ title, description }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      {title ? <div className="text-sm font-semibold text-white">{title}</div> : null}
      {description ? <div className="text-xs text-slate-400">{description}</div> : null}
    </div>
  );
});

export default LoadingState;

