import { Component, type ErrorInfo, type ReactNode } from 'react';
import { errorBoundaryContent } from '../content/components/errorBoundary';

export type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKey?: string | number;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}): JSX.Element {
  return (
    <div
      className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="mb-4 text-4xl" aria-hidden="true">
        !
      </div>
      <h2 className="mb-2 text-lg font-semibold text-white">{errorBoundaryContent.title}</h2>
      <p className="mb-4 max-w-md text-sm text-slate-400">{errorBoundaryContent.description}</p>
      {error && import.meta.env.DEV && (
        <details className="mb-4 max-w-md rounded bg-black/50 p-3 text-left text-xs text-red-300">
          <summary className="cursor-pointer font-medium">{errorBoundaryContent.detailsSummary}</summary>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap">{error.message}</pre>
          <pre className="mt-1 overflow-auto whitespace-pre-wrap text-slate-500">{error.stack}</pre>
        </details>
      )}
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          {errorBoundaryContent.retryButton}
        </button>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          {errorBoundaryContent.reloadButton}
        </button>
      </div>
    </div>
  );
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  return function WithErrorBoundary(props: P): JSX.Element {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
