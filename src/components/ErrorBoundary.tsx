import { Component, type ErrorInfo, type ReactNode } from 'react';

export type ErrorBoundaryProps = {
  children: ReactNode;
  /** Компонент для отображения при ошибке */
  fallback?: ReactNode;
  /** Коллбэк при возникновении ошибки */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Ключ для сброса ошибки (аналог key в React) */
  resetKey?: string | number;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Error Boundary — перехватывает ошибки рендеринга в дочерних компонентах.
 * Предотвращает падение всего приложения при локальных ошибках.
 *
 * @example
 * <ErrorBoundary fallback={<ErrorMessage />}>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * <ErrorBoundary
 *   fallback={
 *     <div className="p-4 text-red-500">
 *       <h2>Что-то пошло не так</h2>
 *       <button onClick={() => window.location.reload()}>Обновить</button>
 *     </div>
 *   }
 *   onError={(error, info) => logErrorToService(error, info)}
 * >
 *   <AdminDashboard />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Логируем ошибку
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Вызываем коллбэк если передан
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Сбрасываем ошибку при изменении resetKey
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Используем кастомный fallback или дефолтный
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Дефолтный компонент отображения ошибки.
 */
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
        ⚠️
      </div>
      <h2 className="mb-2 text-lg font-semibold text-white">Произошла ошибка</h2>
      <p className="mb-4 max-w-md text-sm text-slate-400">
        Что-то пошло не так при загрузке этого компонента. Попробуйте обновить страницу или
        повторить действие.
      </p>
      {error && import.meta.env.DEV && (
        <details className="mb-4 max-w-md rounded bg-black/50 p-3 text-left text-xs text-red-300">
          <summary className="cursor-pointer font-medium">Детали ошибки (dev only)</summary>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap">{error.message}</pre>
          <pre className="mt-1 overflow-auto whitespace-pre-wrap text-slate-500">
            {error.stack}
          </pre>
        </details>
      )}
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Попробовать снова
        </button>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          Обновить страницу
        </button>
      </div>
    </div>
  );
}

/**
 * HOC для оборачивания компонентов в Error Boundary.
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  return function WithErrorBoundary(props: P): JSX.Element {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
