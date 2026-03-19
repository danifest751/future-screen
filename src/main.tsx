import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { AdminDataProvider } from './context/AdminDataContext';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import { installClientErrorLogger } from './lib/clientErrorLogger';
import './index.css';

installClientErrorLogger();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AdminDataProvider>
              <App />
            </AdminDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
