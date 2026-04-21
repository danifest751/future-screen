import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { EditModeProvider } from './context/EditModeContext';
import { I18nProvider } from './context/I18nContext';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { installClientErrorLogger } from './lib/clientErrorLogger';
import './index.css';

installClientErrorLogger();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <BrowserRouter>
            <I18nProvider>
              <ThemeProvider>
                <AuthProvider>
                  <EditModeProvider>
                    <App />
                  </EditModeProvider>
                </AuthProvider>
              </ThemeProvider>
            </I18nProvider>
          </BrowserRouter>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
