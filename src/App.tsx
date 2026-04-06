import { lazy, Suspense, useEffect } from 'react';
import { useLocation, useRoutes } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { StructuredData } from './components/StructuredData';
import { useStarBorderGlobal } from './hooks/useStarBorderGlobal';
import { getGlobalContent } from './content/global';
import { useI18n } from './context/I18nContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const LedPage = lazy(() => import('./pages/LedPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const RentPage = lazy(() => import('./pages/RentPage'));
const RentalCategoryPage = lazy(() => import('./pages/RentalCategoryPage'));
const CasesPage = lazy(() => import('./pages/CasesPage'));
const CaseDetailsPage = lazy(() => import('./pages/CaseDetailsPage'));
const PricesPage = lazy(() => import('./pages/PricesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactsPage = lazy(() => import('./pages/ContactsPage'));
const ConsultPage = lazy(() => import('./pages/ConsultPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminContentPage = lazy(() => import('./pages/admin/AdminContentIndexPage'));
const AdminLeadsPage = lazy(() => import('./pages/admin/AdminLeadsPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCasesPage = lazy(() => import('./pages/admin/AdminCasesRedesignedPage'));
const AdminPackagesPage = lazy(() => import('./pages/admin/AdminPackagesPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminContactsPage = lazy(() => import('./pages/admin/AdminContactsPage'));
const AdminBackgroundsPage = lazy(() => import('./pages/admin/AdminBackgroundsPage'));
const AdminRentalCategoriesPage = lazy(() => import('./pages/admin/AdminRentalCategoriesPage'));
const AdminRentalCategoryEditPage = lazy(() => import('./pages/admin/AdminRentalCategoryEditPage'));
const AdminPrivacyPolicyPage = lazy(() => import('./pages/admin/AdminPrivacyPolicyPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));

const PageLoader = () => (
  <div
    className="flex min-h-[60vh] items-center justify-center"
    style={{ backgroundColor: 'var(--bg-primary, #0a0a0a)' }}
  >
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
  </div>
);

function ChunkErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      const target = event.target as HTMLElement | null;
      const isScript = target?.tagName === 'SCRIPT';
      const isChunkError =
        message.includes('Failed to fetch dynamically') ||
        (isScript && target?.getAttribute('src')?.includes('/assets/'));

      if (isChunkError) {
        console.warn('[ChunkErrorHandler] Detected chunk load error, reloading...');
        setTimeout(() => window.location.reload(), 500);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return null;
}

const App = () => {
  useStarBorderGlobal();
  const location = useLocation();
  const { getLocaleForPath } = useI18n();
  const locale = getLocaleForPath(location.pathname);
  const { appContent } = getGlobalContent(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const routes = [
    { path: '/', element: <HomePage /> },
    { path: '/led', element: <LedPage /> },
    { path: '/support', element: <SupportPage /> },
    { path: '/rent', element: <RentPage /> },
    { path: '/rent/:slug', element: <RentalCategoryPage /> },
    { path: '/cases', element: <CasesPage /> },
    { path: '/cases/:slug', element: <CaseDetailsPage /> },
    { path: '/prices', element: <PricesPage /> },
    { path: '/about', element: <AboutPage /> },
    { path: '/contacts', element: <ContactsPage /> },
    { path: '/consult', element: <ConsultPage /> },
    { path: '/privacy', element: <PrivacyPolicyPage /> },
    { path: '/admin/content', element: <ProtectedRoute><AdminContentPage /></ProtectedRoute> },
    { path: '/admin/leads', element: <ProtectedRoute><AdminLeadsPage /></ProtectedRoute> },
    { path: '/admin/cases', element: <ProtectedRoute><AdminCasesPage /></ProtectedRoute> },
    { path: '/admin/packages', element: <ProtectedRoute><AdminPackagesPage /></ProtectedRoute> },
    { path: '/admin/categories', element: <ProtectedRoute><AdminCategoriesPage /></ProtectedRoute> },
    { path: '/admin/contacts', element: <ProtectedRoute><AdminContactsPage /></ProtectedRoute> },
    { path: '/admin/backgrounds', element: <ProtectedRoute><AdminBackgroundsPage /></ProtectedRoute> },
    { path: '/admin/rental-categories', element: <ProtectedRoute><AdminRentalCategoriesPage /></ProtectedRoute> },
    { path: '/admin/rental/:id', element: <ProtectedRoute><AdminRentalCategoryEditPage /></ProtectedRoute> },
    { path: '/admin/privacy-policy', element: <ProtectedRoute><AdminPrivacyPolicyPage /></ProtectedRoute> },
    { path: '/admin', element: <ProtectedRoute><AdminDashboard /></ProtectedRoute> },
    { path: '*', element: <NotFoundPage /> },
  ];

  const element = useRoutes(routes);

  return (
    <Layout>
      <ChunkErrorHandler />
      <Helmet>
        <title>{appContent.title}</title>
        <meta name="description" content={appContent.description} />
      </Helmet>
      <StructuredData />
      <Suspense fallback={<PageLoader />}>{element}</Suspense>
    </Layout>
  );
};

export default App;
