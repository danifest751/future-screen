import { lazy, Suspense, useEffect } from 'react';
import { useLocation, useRoutes } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { StructuredData } from './components/StructuredData';
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
const AdminRentalCategoriesPage = lazy(() => import('./pages/admin/AdminRentalCategoriesPage'));
const AdminRentalCategoryEditPage = lazy(() => import('./pages/admin/AdminRentalCategoryEditPage'));
const AdminPrivacyPolicyPage = lazy(() => import('./pages/admin/AdminPrivacyPolicyPage'));
const AdminVisualLedLogsPage = lazy(() => import('./pages/admin/AdminVisualLedLogsPage'));
const AdminVisualLedSessionPage = lazy(() => import('./pages/admin/AdminVisualLedSessionPage'));
const AdminHomeEquipmentSectionPage = lazy(() => import('./pages/admin/AdminHomeEquipmentSectionPage'));
const AdminContentHistoryPage = lazy(() => import('./pages/admin/AdminContentHistoryPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const VisualLedEditorPage = lazy(() => import('./pages/VisualLedEditorPage'));
const VisualLedV2Page = lazy(() => import('./pages/VisualLedV2Page'));

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
        setTimeout(() => window.location.reload(), 500);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return null;
}

const App = () => {
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
    { path: '/admin/content', element: <ProtectedRoute requiredRole="admin"><AdminContentPage /></ProtectedRoute> },
    { path: '/admin/leads', element: <ProtectedRoute requiredRole="admin"><AdminLeadsPage /></ProtectedRoute> },
    { path: '/admin/cases', element: <ProtectedRoute requiredRole="admin"><AdminCasesPage /></ProtectedRoute> },
    { path: '/admin/packages', element: <ProtectedRoute requiredRole="admin"><AdminPackagesPage /></ProtectedRoute> },
    { path: '/admin/categories', element: <ProtectedRoute requiredRole="admin"><AdminCategoriesPage /></ProtectedRoute> },
    { path: '/admin/contacts', element: <ProtectedRoute requiredRole="admin"><AdminContactsPage /></ProtectedRoute> },
    { path: '/admin/rental-categories', element: <ProtectedRoute requiredRole="admin"><AdminRentalCategoriesPage /></ProtectedRoute> },
    { path: '/admin/rental/:id', element: <ProtectedRoute requiredRole="admin"><AdminRentalCategoryEditPage /></ProtectedRoute> },
    { path: '/admin/privacy-policy', element: <ProtectedRoute requiredRole="admin"><AdminPrivacyPolicyPage /></ProtectedRoute> },
    { path: '/admin/content/home-equipment', element: <ProtectedRoute requiredRole="admin"><AdminHomeEquipmentSectionPage /></ProtectedRoute> },
    { path: '/admin/content/history', element: <ProtectedRoute requiredRole="admin"><AdminContentHistoryPage /></ProtectedRoute> },
    { path: '/admin/visual-led-logs', element: <ProtectedRoute requiredRole="admin"><AdminVisualLedLogsPage /></ProtectedRoute> },
    { path: '/admin/visual-led-logs/:sessionId', element: <ProtectedRoute requiredRole="admin"><AdminVisualLedSessionPage /></ProtectedRoute> },
    { path: '/admin', element: <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute> },
    // Cutover: the React rewrite (VisualLedV2Page) is the primary
    // `/visual-led` entry point now. `/visual-led/v2` is kept as an
    // alias so old share links from the beta period keep working, and
    // `/visual-led/legacy` still opens the old HTML via iframe for
    // fallback / rollback during the observation period.
    { path: '/visual-led', element: <VisualLedV2Page /> },
    { path: '/visual-led/v2', element: <VisualLedV2Page /> },
    { path: '/visual-led/legacy', element: <VisualLedEditorPage /> },
    { path: '*', element: <NotFoundPage /> },
  ];

  const element = useRoutes(routes);
  const isFullscreenTool = location.pathname.startsWith('/visual-led');

  if (isFullscreenTool) {
    return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
  }

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
